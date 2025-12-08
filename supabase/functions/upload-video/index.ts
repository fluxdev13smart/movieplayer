import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, title } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Downloading video from:", url);

    // Check if URL looks like a streamable video (not a huge file download)
    const urlLower = url.toLowerCase();
    const isLikelyLargeFile = urlLower.includes("1080p") || urlLower.includes("2160p") || 
                              urlLower.includes("4k") || urlLower.endsWith(".mkv");
    
    if (isLikelyLargeFile) {
      console.warn("Large file detected, may timeout");
    }

    // Fetch the video with timeout
    let response: Response;
    try {
      response = await fetchWithTimeout(url, 55000); // 55s timeout (edge functions have 60s limit)
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : "Unknown error";
      console.error("Fetch error:", errorMsg);
      
      if (errorMsg.includes("abort") || errorMsg.includes("timeout")) {
        return new Response(
          JSON.stringify({ 
            error: "Download timed out. The file may be too large or the server is slow. Try a smaller video or a direct .mp4 link." 
          }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Could not connect to the video server. The server may be blocking downloads or is unreachable." 
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      console.error("Failed to fetch video:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `Server returned ${response.status}: ${response.statusText}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check content length - limit to ~50MB for edge function memory
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ 
          error: "File too large (max 50MB). Please use a smaller video or a streaming link." 
        }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const videoBuffer = await response.arrayBuffer();
    
    console.log("Video downloaded, size:", videoBuffer.byteLength, "bytes");

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const extension = contentType.includes("mp4") ? "mp4" : 
                      contentType.includes("webm") ? "webm" : 
                      contentType.includes("ogg") ? "ogg" : "mp4";
    const filename = `${crypto.randomUUID()}.${extension}`;
    
    console.log("Uploading to storage as:", filename);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("public-videos")
      .upload(filename, videoBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload video to storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("public-videos")
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;
    const videoTitle = title || `Video ${new Date().toISOString().split('T')[0]}`;

    console.log("Public URL:", publicUrl);

    // Save to database
    const { data: videoData, error: dbError } = await supabase
      .from("public_videos")
      .insert({
        title: videoTitle,
        original_url: url,
        storage_path: filename,
        public_url: publicUrl,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save video record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video saved to database:", videoData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        video: videoData,
        publicUrl 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

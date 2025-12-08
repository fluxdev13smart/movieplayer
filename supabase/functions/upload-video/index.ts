import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Fetch the video
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch video:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: "Failed to download video from URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

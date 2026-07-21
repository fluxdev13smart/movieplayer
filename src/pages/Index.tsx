import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PublicVideo {
  id: string;
  title: string;
  original_url: string;
  storage_path: string;
  public_url: string;
  created_at: string;
}

interface LanguageTrack {
  lang: string;
  url: string;
}

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [playingUrl, setPlayingUrl] = useState("");
  const [watchLater, setWatchLater] = useState<string[]>([]);
  const [publicVideos, setPublicVideos] = useState<PublicVideo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showPublicVideos, setShowPublicVideos] = useState(false);
  const [languageTracks, setLanguageTracks] = useState<LanguageTrack[]>([]);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAddLang, setShowAddLang] = useState(false);
  const [newLangName, setNewLangName] = useState("");
  const [newLangUrl, setNewLangUrl] = useState("");
  const [activeLang, setActiveLang] = useState<string>("Original");
  const { toast } = useToast();

  // Fetch public videos
  const fetchPublicVideos = async () => {
    const { data, error } = await supabase
      .from("public_videos")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data && !error) {
      setPublicVideos(data as PublicVideo[]);
    }
  };

  useEffect(() => {
    fetchPublicVideos();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("watchLater");
    if (saved) {
      setWatchLater(JSON.parse(saved));
    }
  }, []);

  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return getYouTubeVideoId(url) !== null;
  };

  const isSubtitleFile = (url: string): boolean => {
    return url.toLowerCase().endsWith('.srt') || url.toLowerCase().includes('.srt');
  };

  useEffect(() => {
    // Check for shared video in URL params
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("v");
    if (sharedUrl) {
      const decodedUrl = decodeURIComponent(sharedUrl);
      setVideoUrl(decodedUrl);
      setPlayingUrl(decodedUrl);
    }
  }, []);

  const handlePlay = () => {
    if (videoUrl.trim()) {
      setPlayingUrl(videoUrl);
    }
  };

  const handleClear = () => {
    setVideoUrl("");
    setPlayingUrl("");
    window.history.replaceState({}, "", window.location.pathname);
  };

  const handleShare = async () => {
    if (!playingUrl) {
      toast({
        title: "No video to share",
        description: "Please load a video first",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(playingUrl)}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link to play the same video",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleWatchLater = () => {
    if (!playingUrl) {
      toast({
        title: "No video to save",
        description: "Please load a video first",
        variant: "destructive",
      });
      return;
    }

    const updated = [...watchLater, playingUrl];
    setWatchLater(updated);
    localStorage.setItem("watchLater", JSON.stringify(updated));
    
    toast({
      title: "Saved to Watch Later",
      description: "Video added to your list",
    });
  };

  const handleUploadToCloud = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "No URL provided",
        description: "Please paste a video link first",
        variant: "destructive",
      });
      return;
    }

    if (isYouTubeUrl(videoUrl)) {
      toast({
        title: "YouTube not supported",
        description: "Only direct video URLs can be uploaded to cloud",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("upload-video", {
        body: { url: videoUrl, title: `Video ${new Date().toLocaleDateString()}` },
      });

      if (error) throw error;

      toast({
        title: "Video uploaded!",
        description: "Video is now public and anyone can watch it",
      });

      // Refresh public videos list
      fetchPublicVideos();
      
      // Play the uploaded video
      setPlayingUrl(data.publicUrl);
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6 animate-fade-in">
        <div className="flex gap-4 items-center">
          <div className="input-group">
            <input
              required
              type="url"
              name="url"
              autoComplete="off"
              className="custom-input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            />
            <label className="user-label">Paste video link here...</label>
          </div>

          <button onClick={handlePlay} className="play-button">
            <span>PLAY</span>
          </button>

          <button onClick={handleClear} className="delete-button" title="Clear">
            <svg viewBox="0 0 448 512" className="delete-icon">
              <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
            </svg>
          </button>

          <button onClick={handleShare} className="share-button" title="Share">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="share-icon">
              <path d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304C0 417.3 81.5 467.9 100.2 478.1c2.5 1.4 5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7c0-7.5-4.3-14.4-9.8-19.5C108.8 431.9 96 414.4 96 384c0-53 43-96 96-96h96v64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144c-9.4-8.5-22.9-10.6-34.4-5.4z"></path>
            </svg>
            Share
          </button>

          <div className="watch-later-container" onClick={handleWatchLater} title="Watch Later">
            <div className="face">
              <p className="v-index">II</p>
              <p className="h-index">II</p>
              <div className="hand">
                <div className="hour"></div>
                <div className="minute"></div>
                <div className="second"></div>
              </div>
            </div>
            <span className="watch-later-text">Watch Later</span>
          </div>

          <button 
            onClick={handleUploadToCloud} 
            disabled={isUploading}
            className="cloud-upload-button"
            title="Upload to Cloud"
          >
            {isUploading ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg viewBox="0 0 24 24" className="cloud-icon" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 16v-8m0 0l-3 3m3-3l3 3" />
                <path d="M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935" />
              </svg>
            )}
            <span>{isUploading ? "Uploading..." : "Upload"}</span>
          </button>

          <button 
            onClick={() => setShowPublicVideos(!showPublicVideos)} 
            className="browse-button"
            title="Browse Public Videos"
          >
            <svg viewBox="0 0 24 24" className="browse-icon" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span>Browse</span>
          </button>
        </div>

        {showPublicVideos && (
          <div className="public-videos-grid">
            <h3 className="text-foreground text-lg mb-4">Public Videos</h3>
            {publicVideos.length === 0 ? (
              <p className="text-muted-foreground">No public videos yet. Upload one!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {publicVideos.map((video) => (
                  <div 
                    key={video.id} 
                    className="video-card"
                    onClick={() => {
                      setPlayingUrl(video.public_url);
                      setShowPublicVideos(false);
                    }}
                  >
                    <div className="video-card-preview">
                      <video src={video.public_url} muted preload="metadata" />
                    </div>
                    <p className="video-card-title">{video.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {playingUrl && (
          <div className="video-player-wrapper animate-scale-in">
            <div className="video-player-frame">
              {isSubtitleFile(playingUrl) ? (
                <div className="w-full h-full flex items-center justify-center p-8 text-foreground">
                  <div className="text-center space-y-4">
                    <p className="text-xl">Subtitle file detected</p>
                    <a
                      href={playingUrl}
                      download
                      className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Download Subtitle
                    </a>
                  </div>
                </div>
              ) : isYouTubeUrl(playingUrl) ? (
                <iframe
                  key={playingUrl}
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(playingUrl)}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  key={playingUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  src={playingUrl}
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {/* Language selector overlay */}
              {!isSubtitleFile(playingUrl) && !isYouTubeUrl(playingUrl) && (
                <div className="lang-overlay">
                  <button
                    className="lang-button"
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    title="Change language"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="lang-icon">
                      <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
                    </svg>
                    <span>{activeLang}</span>
                  </button>

                  {showLangMenu && (
                    <div className="lang-menu">
                      <button
                        className={`lang-menu-item ${activeLang === "Original" ? "active" : ""}`}
                        onClick={() => {
                          setPlayingUrl(videoUrl);
                          setActiveLang("Original");
                          setShowLangMenu(false);
                        }}
                      >
                        Original
                      </button>
                      {languageTracks.map((track) => (
                        <button
                          key={track.lang}
                          className={`lang-menu-item ${activeLang === track.lang ? "active" : ""}`}
                          onClick={() => {
                            setPlayingUrl(track.url);
                            setActiveLang(track.lang);
                            setShowLangMenu(false);
                          }}
                        >
                          {track.lang}
                        </button>
                      ))}
                      <button
                        className="lang-menu-item add"
                        onClick={() => {
                          setShowAddLang(true);
                          setShowLangMenu(false);
                        }}
                      >
                        + Add language
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add language modal */}
            {showAddLang && (
              <div className="add-lang-modal">
                <input
                  type="text"
                  className="custom-input"
                  placeholder="Language name (e.g. Spanish)"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                />
                <input
                  type="url"
                  className="custom-input"
                  placeholder="Video URL for that language"
                  value={newLangUrl}
                  onChange={(e) => setNewLangUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="browse-button"
                    onClick={() => {
                      if (newLangName.trim() && newLangUrl.trim()) {
                        setLanguageTracks([
                          ...languageTracks,
                          { lang: newLangName.trim(), url: newLangUrl.trim() },
                        ]);
                        setNewLangName("");
                        setNewLangUrl("");
                        setShowAddLang(false);
                        toast({ title: "Language added" });
                      }
                    }}
                  >
                    Add
                  </button>
                  <button
                    className="browse-button"
                    onClick={() => setShowAddLang(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

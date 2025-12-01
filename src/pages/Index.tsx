import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [playingUrl, setPlayingUrl] = useState("");
  const [watchLater, setWatchLater] = useState<string[]>([]);
  const { toast } = useToast();

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
        </div>

        {playingUrl && (
          <div className="w-full aspect-video bg-card rounded-lg overflow-hidden border border-border animate-scale-in">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, X } from "lucide-react";

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [playingUrl, setPlayingUrl] = useState("");
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Paste video link here..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePlay()}
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button 
            onClick={handlePlay}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Play
          </Button>
          <Button 
            onClick={handleClear}
            variant="secondary"
            size="icon"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleShare}
            variant="secondary"
            size="icon"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {playingUrl && (
          <div className="w-full aspect-video bg-card rounded-lg overflow-hidden border border-border">
            {isYouTubeUrl(playingUrl) ? (
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

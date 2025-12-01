import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Trash2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WatchLater = () => {
  const [videos, setVideos] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("watchLater");
    if (saved) {
      setVideos(JSON.parse(saved));
    }
  }, []);

  const removeVideo = (url: string) => {
    const updated = videos.filter((v) => v !== url);
    setVideos(updated);
    localStorage.setItem("watchLater", JSON.stringify(updated));
    toast({
      title: "Removed from Watch Later",
      description: "Video has been removed from your list",
    });
  };

  const playVideo = (url: string) => {
    navigate(`/?v=${encodeURIComponent(url)}`);
  };

  const clearAll = () => {
    setVideos([]);
    localStorage.setItem("watchLater", JSON.stringify([]));
    toast({
      title: "All cleared",
      description: "All videos removed from Watch Later",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-foreground">Watch Later</h1>
            {videos.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📺</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">No videos saved yet</h2>
              <p className="text-muted-foreground">Videos you save for later will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {videos.map((url, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-accent transition-all group"
                >
                  <div className="aspect-video bg-secondary flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => playVideo(url)}
                        className="p-4 bg-accent text-accent-foreground rounded-full hover:scale-110 transition-transform"
                      >
                        <Play size={24} fill="currentColor" />
                      </button>
                    </div>
                    <span className="text-4xl">🎬</span>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground truncate" title={url}>
                      {url}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => playVideo(url)}
                        className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
                      >
                        <Play size={16} />
                        Play
                      </button>
                      
                      <button
                        onClick={() => removeVideo(url)}
                        className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchLater;

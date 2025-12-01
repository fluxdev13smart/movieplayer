import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Plus, Trash2, Play, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Playlist {
  id: string;
  name: string;
  videos: string[];
  createdAt: number;
}

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      const playlists: Playlist[] = JSON.parse(saved);
      const found = playlists.find((p) => p.id === id);
      if (found) {
        setPlaylist(found);
      } else {
        navigate("/playlists");
      }
    }
  }, [id, navigate]);

  const updatePlaylist = (updated: Playlist) => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      const playlists: Playlist[] = JSON.parse(saved);
      const newPlaylists = playlists.map((p) => (p.id === id ? updated : p));
      localStorage.setItem("playlists", JSON.stringify(newPlaylists));
      setPlaylist(updated);
    }
  };

  const addVideo = () => {
    if (!playlist || !newVideoUrl.trim()) return;

    const updated = {
      ...playlist,
      videos: [...playlist.videos, newVideoUrl],
    };
    updatePlaylist(updated);
    setNewVideoUrl("");
    
    toast({
      title: "Video added",
      description: "Video has been added to playlist",
    });
  };

  const removeVideo = (index: number) => {
    if (!playlist) return;

    const updated = {
      ...playlist,
      videos: playlist.videos.filter((_, i) => i !== index),
    };
    updatePlaylist(updated);
    
    toast({
      title: "Video removed",
      description: "Video has been removed from playlist",
    });
  };

  const playFromIndex = (index: number) => {
    if (!playlist) return;

    sessionStorage.setItem("activePlaylist", playlist.id);
    sessionStorage.setItem("playlistVideos", JSON.stringify(playlist.videos));
    sessionStorage.setItem("currentVideoIndex", index.toString());
    navigate(`/?v=${encodeURIComponent(playlist.videos[index])}&playlist=${playlist.id}`);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!playlist || draggedIndex === null || draggedIndex === index) return;

    const items = [...playlist.videos];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    updatePlaylist({ ...playlist, videos: items });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (!playlist) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate("/playlists")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Playlists
          </button>

          <h1 className="text-4xl font-bold text-foreground mb-8">{playlist.name}</h1>

          <div className="mb-6 p-4 bg-card border border-border rounded-lg">
            <div className="flex gap-2">
              <input
                type="url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addVideo()}
                placeholder="Paste video URL to add..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
              />
              <button
                onClick={addVideo}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          {playlist.videos.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <div className="text-6xl mb-4">📹</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">No videos yet</h2>
              <p className="text-muted-foreground">Add videos to start building your playlist</p>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              {playlist.videos.map((url, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-accent transition-all cursor-move ${
                    draggedIndex === index ? "opacity-50" : ""
                  }`}
                >
                  <GripVertical size={20} className="text-muted-foreground flex-shrink-0" />
                  
                  <span className="text-muted-foreground font-mono text-sm flex-shrink-0 w-8">
                    {index + 1}.
                  </span>
                  
                  <p className="flex-1 text-sm text-foreground truncate" title={url}>
                    {url}
                  </p>
                  
                  <button
                    onClick={() => playFromIndex(index)}
                    className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center gap-1 flex-shrink-0"
                  >
                    <Play size={14} />
                    Play
                  </button>
                  
                  <button
                    onClick={() => removeVideo(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;

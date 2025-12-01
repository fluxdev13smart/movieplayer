import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Plus, Trash2, Play, Edit2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Playlist {
  id: string;
  name: string;
  videos: string[];
  createdAt: number;
}

const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("playlists");
    if (saved) {
      setPlaylists(JSON.parse(saved));
    }
  }, []);

  const saveToStorage = (updated: Playlist[]) => {
    localStorage.setItem("playlists", JSON.stringify(updated));
    setPlaylists(updated);
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: newPlaylistName,
      videos: [],
      createdAt: Date.now(),
    };

    saveToStorage([...playlists, newPlaylist]);
    setNewPlaylistName("");
    setIsCreating(false);
    
    toast({
      title: "Playlist created",
      description: `"${newPlaylistName}" has been created`,
    });
  };

  const deletePlaylist = (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    saveToStorage(playlists.filter((p) => p.id !== id));
    
    toast({
      title: "Playlist deleted",
      description: `"${playlist?.name}" has been removed`,
    });
  };

  const renamePlaylist = (id: string) => {
    if (!editName.trim()) return;

    const updated = playlists.map((p) =>
      p.id === id ? { ...p, name: editName } : p
    );
    saveToStorage(updated);
    setEditingId(null);
    setEditName("");
    
    toast({
      title: "Playlist renamed",
      description: "Playlist name has been updated",
    });
  };

  const playPlaylist = (playlist: Playlist) => {
    if (playlist.videos.length === 0) {
      toast({
        title: "Empty playlist",
        description: "Add videos to this playlist first",
        variant: "destructive",
      });
      return;
    }

    // Store playlist ID and navigate to first video
    sessionStorage.setItem("activePlaylist", playlist.id);
    sessionStorage.setItem("playlistVideos", JSON.stringify(playlist.videos));
    sessionStorage.setItem("currentVideoIndex", "0");
    navigate(`/?v=${encodeURIComponent(playlist.videos[0])}&playlist=${playlist.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-foreground">Playlists</h1>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={20} />
              New Playlist
            </button>
          </div>

          {isCreating && (
            <div className="mb-6 p-4 bg-card border border-border rounded-lg animate-fade-in">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
                  placeholder="Playlist name..."
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                  autoFocus
                />
                <button
                  onClick={createPlaylist}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPlaylistName("");
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {playlists.length === 0 && !isCreating ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">No playlists yet</h2>
              <p className="text-muted-foreground mb-6">Create your first playlist to organize your videos</p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={20} />
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-accent transition-all group"
                >
                  <div className="aspect-video bg-gradient-to-br from-accent/20 to-secondary flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => playPlaylist(playlist)}
                        disabled={playlist.videos.length === 0}
                        className="p-4 bg-accent text-accent-foreground rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size={24} fill="currentColor" />
                      </button>
                    </div>
                    <span className="text-6xl">📁</span>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {editingId === playlist.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && renamePlaylist(playlist.id)}
                          className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => renamePlaylist(playlist.id)}
                          className="p-1 text-accent hover:text-accent/80"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate">{playlist.name}</h3>
                        <button
                          onClick={() => {
                            setEditingId(playlist.id);
                            setEditName(playlist.name);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      {playlist.videos.length} video{playlist.videos.length !== 1 ? "s" : ""}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => playPlaylist(playlist)}
                        disabled={playlist.videos.length === 0}
                        className="flex-1 px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size={16} />
                        Play
                      </button>
                      
                      <button
                        onClick={() => navigate(`/playlists/${playlist.id}`)}
                        className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                      >
                        Manage
                      </button>
                      
                      <button
                        onClick={() => deletePlaylist(playlist.id)}
                        className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                        title="Delete"
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

export default Playlists;

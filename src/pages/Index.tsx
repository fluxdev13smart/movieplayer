import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { SkipForward, List, Plus } from "lucide-react";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videoUrl, setVideoUrl] = useState("");
  const [playingUrl, setPlayingUrl] = useState("");
  const [watchLater, setWatchLater] = useState<string[]>([]);
  const [playlistVideos, setPlaylistVideos] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("watchLater");
    if (saved) {
      setWatchLater(JSON.parse(saved));
    }

    // Check for shared video or playlist in URL params
    const sharedUrl = searchParams.get("v");
    const playlistParam = searchParams.get("playlist");
    
    if (sharedUrl) {
      const decodedUrl = decodeURIComponent(sharedUrl);
      setVideoUrl(decodedUrl);
      setPlayingUrl(decodedUrl);
    }

    // Load playlist if present
    if (playlistParam) {
      const savedVideos = sessionStorage.getItem("playlistVideos");
      const savedIndex = sessionStorage.getItem("currentVideoIndex");
      
      if (savedVideos) {
        const videos = JSON.parse(savedVideos);
        setPlaylistVideos(videos);
        setPlaylistId(playlistParam);
        setCurrentVideoIndex(savedIndex ? parseInt(savedIndex) : 0);
      }
    }
  }, [searchParams]);

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

    if (watchLater.includes(playingUrl)) {
      toast({
        title: "Already saved",
        description: "This video is already in your Watch Later list",
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

  const playNextInPlaylist = () => {
    if (!playlistVideos.length || currentVideoIndex >= playlistVideos.length - 1) {
      toast({
        title: "End of playlist",
        description: "You've reached the last video",
      });
      return;
    }

    const nextIndex = currentVideoIndex + 1;
    const nextVideo = playlistVideos[nextIndex];
    
    setCurrentVideoIndex(nextIndex);
    setPlayingUrl(nextVideo);
    setVideoUrl(nextVideo);
    sessionStorage.setItem("currentVideoIndex", nextIndex.toString());
    
    setSearchParams({ v: nextVideo, playlist: playlistId || "" });
  };

  const exitPlaylist = () => {
    setPlaylistVideos([]);
    setPlaylistId(null);
    setCurrentVideoIndex(0);
    sessionStorage.removeItem("activePlaylist");
    sessionStorage.removeItem("playlistVideos");
    sessionStorage.removeItem("currentVideoIndex");
    setSearchParams({});
  };

  const addToPlaylist = (playlistId: string) => {
    if (!playingUrl) return;

    const saved = localStorage.getItem("playlists");
    if (!saved) return;

    const playlists = JSON.parse(saved);
    const updated = playlists.map((p: any) => {
      if (p.id === playlistId) {
        if (!p.videos.includes(playingUrl)) {
          return { ...p, videos: [...p.videos, playingUrl] };
        }
      }
      return p;
    });

    localStorage.setItem("playlists", JSON.stringify(updated));
    setShowAddToPlaylist(false);

    toast({
      title: "Added to playlist",
      description: "Video has been added to the playlist",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 px-4 pb-8 flex items-center justify-center">
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

          {playingUrl && (
            <div className="relative">
              <button
                onClick={() => setShowAddToPlaylist(!showAddToPlaylist)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                title="Add to Playlist"
              >
                <Plus size={16} />
                Playlist
              </button>

              {showAddToPlaylist && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg p-2 z-50 animate-fade-in">
                  <p className="text-xs text-muted-foreground px-2 py-1">Add to playlist:</p>
                  {(() => {
                    const saved = localStorage.getItem("playlists");
                    const playlists = saved ? JSON.parse(saved) : [];
                    
                    if (playlists.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground px-2 py-2">
                          No playlists yet. Create one first!
                        </p>
                      );
                    }

                    return playlists.map((playlist: any) => (
                      <button
                        key={playlist.id}
                        onClick={() => addToPlaylist(playlist.id)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                      >
                        {playlist.name}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {playingUrl && (
          <div className="space-y-4">
            {playlistId && (
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <List className="text-accent" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">Playing from playlist</p>
                    <p className="text-foreground font-medium">
                      Video {currentVideoIndex + 1} of {playlistVideos.length}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={playNextInPlaylist}
                    disabled={currentVideoIndex >= playlistVideos.length - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward size={16} />
                    Next
                  </button>
                  <button
                    onClick={exitPlaylist}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    Exit Playlist
                  </button>
                </div>
              </div>
            )}

            <div className="w-full aspect-video bg-card rounded-lg overflow-hidden border border-border animate-scale-in">
              <VideoPlayer
                videoUrl={playingUrl}
                isYouTube={isYouTubeUrl(playingUrl)}
                youtubeId={getYouTubeVideoId(playingUrl)}
                isSubtitle={isSubtitleFile(playingUrl)}
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Index;

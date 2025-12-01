import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";

interface SubtitleTrack {
  id: string;
  name: string;
  url: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  isYouTube: boolean;
  youtubeId?: string | null;
  isSubtitle: boolean;
}

const VideoPlayer = ({ videoUrl, isYouTube, youtubeId, isSubtitle }: VideoPlayerProps) => {
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Clear subtitles when video changes
    setSubtitles([]);
    setActiveSubtitle(null);
    
    // Auto-play video when URL changes
    if (videoRef.current && !isYouTube && !isSubtitle) {
      videoRef.current.play().catch((error) => {
        console.log("Autoplay prevented:", error);
      });
    }
  }, [videoUrl, isYouTube, isSubtitle]);

  const handleSubtitleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) {
        const url = URL.createObjectURL(file);
        const newTrack: SubtitleTrack = {
          id: crypto.randomUUID(),
          name: file.name,
          url: url,
        };
        setSubtitles((prev) => [...prev, newTrack]);
      }
    });
  };

  const removeSubtitle = (id: string) => {
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
    if (activeSubtitle === id) {
      setActiveSubtitle(null);
    }
  };

  if (isSubtitle) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 text-foreground">
        <div className="text-center space-y-4">
          <p className="text-xl">Subtitle file detected</p>
          <a
            href={videoUrl}
            download
            className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Download Subtitle
          </a>
        </div>
      </div>
    );
  }

  if (isYouTube && youtubeId) {
    return (
      <iframe
        key={videoUrl}
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&cc_load_policy=1`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          key={videoUrl}
          controls
          autoPlay
          className="w-full h-full"
          src={videoUrl}
          crossOrigin="anonymous"
          onLoadedData={(e) => {
            e.currentTarget.play().catch((error) => {
              console.log("Autoplay prevented:", error);
            });
          }}
        >
          {subtitles.map((subtitle) => (
            <track
              key={subtitle.id}
              kind="subtitles"
              src={subtitle.url}
              label={subtitle.name}
              default={activeSubtitle === subtitle.id}
            />
          ))}
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="bg-card p-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
            <Upload size={16} />
            <span className="text-sm">Upload Subtitles</span>
            <input
              type="file"
              accept=".srt,.vtt"
              multiple
              className="hidden"
              onChange={handleSubtitleUpload}
            />
          </label>
        </div>

        {subtitles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Subtitle Tracks:</p>
            <div className="flex flex-wrap gap-2">
              {subtitles.map((subtitle) => (
                <div
                  key={subtitle.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeSubtitle === subtitle.id
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-secondary text-secondary-foreground border-border hover:border-accent"
                  }`}
                  onClick={() => {
                    setActiveSubtitle(subtitle.id);
                    if (videoRef.current) {
                      const tracks = videoRef.current.textTracks;
                      for (let i = 0; i < tracks.length; i++) {
                        tracks[i].mode = tracks[i].label === subtitle.name ? "showing" : "hidden";
                      }
                    }
                  }}
                >
                  <span className="text-sm">{subtitle.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSubtitle(subtitle.id);
                    }}
                    className="hover:text-destructive transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;

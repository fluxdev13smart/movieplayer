import { Link, useLocation } from "react-router-dom";
import { Home, Clock, List } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">VideoHub</h1>
          
          <div className="flex gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Home size={20} />
              <span>Home</span>
            </Link>

            <Link
              to="/watch-later"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/watch-later")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Clock size={20} />
              <span>Watch Later</span>
            </Link>

            <Link
              to="/playlists"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/playlists")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <List size={20} />
              <span>Playlists</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

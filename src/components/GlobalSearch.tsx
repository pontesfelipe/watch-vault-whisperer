import { useState, useEffect, useRef } from "react";
import { Search, X, Watch, User, Hash, Plus, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  type: "watch" | "user" | "tag";
  id: string;
  title: string;
  subtitle?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search watches
        const { data: watches } = await supabase
          .from("watches")
          .select("id, brand, model, dial_color")
          .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
          .limit(5);

        if (watches) {
          watches.forEach((w) => {
            searchResults.push({
              type: "watch",
              id: w.id,
              title: `${w.brand} ${w.model}`,
              subtitle: w.dial_color,
            });
          });
        }

        // Search users by username
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(5);

        if (users) {
          users.forEach((u) => {
            searchResults.push({
              type: "user",
              id: u.id,
              title: u.username || u.full_name || "User",
              subtitle: u.full_name,
            });
          });
        }

        // Search tags
        const { data: tags } = await supabase
          .from("tags")
          .select("id, name, category")
          .ilike("name", `%${query}%`)
          .limit(5);

        if (tags) {
          tags.forEach((t) => {
            searchResults.push({
              type: "tag",
              id: t.id,
              title: t.name,
              subtitle: t.category,
            });
          });
        }
      } catch (error) {
        console.error("Search error:", error);
      }

      setResults(searchResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === "watch") {
      navigate(`/watch/${result.id}`);
    } else if (result.type === "user") {
      navigate(`/profile/${result.id}`);
    } else if (result.type === "tag") {
      navigate(`/feed?tag=${result.title}`);
    }
    setIsOpen(false);
    setQuery("");
  };

  const handleQuickLog = () => {
    navigate("/log", { state: { watchName: query } });
    setIsOpen(false);
    setQuery("");
  };

  const handleAddWatch = () => {
    navigate("/log", { state: { addNew: true, watchName: query } });
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "watch":
        return <Watch className="h-4 w-4 text-muted-foreground" />;
      case "user":
        return <User className="h-4 w-4 text-muted-foreground" />;
      case "tag":
        return <Hash className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full">
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <Search className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search watches, users, tags...</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Search Modal */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed inset-x-0 top-0 z-50 p-4 md:p-8 md:max-w-xl md:mx-auto"
            >
              <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search watches, users, tags..."
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Quick Actions */}
                {query.trim() && (
                  <div className="p-2 border-b border-border flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleQuickLog}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Log "{query}"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddWatch}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add to Collection
                    </Button>
                  </div>
                )}

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : results.length > 0 ? (
                    <div className="p-2">
                      {results.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-sm text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {result.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : query.trim() ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No results found for "{query}"</p>
                      <p className="text-sm mt-2">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-sm">Start typing to search...</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

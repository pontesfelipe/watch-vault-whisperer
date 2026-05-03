import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { purgeBrowserCachesAndReload } from "@/utils/cacheReset";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Route recovery</p>
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-muted-foreground">
            This route is not available in the app shell currently loaded by your browser.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => purgeBrowserCachesAndReload({ targetPath: "/auth" })}>
            Clear Cache &amp; Reload
          </Button>
          <Button variant="outline" onClick={() => window.location.assign("/") }>
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

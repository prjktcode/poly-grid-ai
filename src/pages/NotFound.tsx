import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center glass-card p-12 rounded-2xl max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-8 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="inline-block">
          <Button variant="hero">Return to Home</Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;

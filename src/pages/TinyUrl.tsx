import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, Check, AlertCircle, History, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/lib/externalSupabase";
import { runTinyUrl } from "@/api/runTinyUrl";

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/webhook/tinyurl";

interface UrlShortenerItem {
  id: number;
  created_at: string;
  original_url?: string;
  url?: string;
  shortened_url?: string;
  short_url?: string;
  tiny_url?: string;
  user_id?: string | null;
  user_email?: string | null;
  [key: string]: any;
}

const TinyUrl = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState<UrlShortenerItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedHistoryUrl, setCopiedHistoryUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShortenedUrl("");

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (include http:// or https://)");
      return;
    }

    setIsLoading(true);

    try {
      const result = await runTinyUrl({ 
        url, 
        webhookUrl: WEBHOOK_URL,
        userId: user?.id || null,
        userEmail: user?.email || null,
      });

      if (result.success && result.data?.shortenedUrl) {
        setShortenedUrl(result.data.shortenedUrl);
        
        // Clear the input field
        setUrl("");

        // Refresh history if it's open (n8n already saves to database)
        if (showHistory) {
          // Wait a moment for n8n to save, then refresh
          setTimeout(async () => {
            await fetchHistory();
          }, 1000);
        }

        toast({
          title: "Success!",
          description: "Your URL has been shortened.",
        });
      } else {
        throw new Error(result.error || "Failed to shorten URL");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortenedUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Shortened URL copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleCopyHistory = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHistoryUrl(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard.",
      });
      setTimeout(() => setCopiedHistoryUrl(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const fetchHistory = async () => {
    try {
      let query = externalSupabase
        .from("url_shortener")
        .select("*");

      // Filter by user if logged in, but also include items without user info (for backward compatibility)
      if (user?.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else if (user?.email) {
        query = query.or(`user_email.eq.${user.email},user_email.is.null`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching history:", error);
        // If OR query fails, try fetching all and filter in JavaScript
        console.log("Attempting fallback: fetching all history");
        const fallbackQuery = externalSupabase
          .from("url_shortener")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50); // Fetch more to filter
        
        const fallbackResult = await fallbackQuery;
        if (fallbackResult.error) {
          console.error("Fallback query also failed:", fallbackResult.error);
          setHistoryItems([]);
          return;
        }
        
        // Filter in JavaScript for backward compatibility
        let filteredItems = fallbackResult.data || [];
        if (user?.id || user?.email) {
          filteredItems = filteredItems.filter((item: UrlShortenerItem) => 
            (!item.user_id && !item.user_email) || 
            item.user_id === user?.id || 
            item.user_email === user?.email
          );
        }
        
        setHistoryItems(filteredItems.slice(0, 10));
        return;
      }
      
      setHistoryItems(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setHistoryItems([]);
    }
  };

  const toggleHistory = async () => {
    if (!showHistory) {
      await fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  // Refetch history when user changes (if history is open)
  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [user, showHistory]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            URL Shortener
          </h1>
          <p className="text-muted-foreground text-lg">Transform your long URLs into short, shareable links</p>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-foreground">
                Enter your long URL
              </label>
              <Input
                id="url"
                type="text"
                placeholder="https://example.com/very/long/url/that/needs/shortening"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 text-base"
                disabled={isLoading}
                required
              />
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-destructive text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  <span className="ml-2">Shorten URL</span>
                </>
              )}
            </Button>
          </form>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 p-4 bg-muted/50 rounded-lg border border-border"
            >
              <p className="text-muted-foreground text-center">Your link is being processed...</p>
            </motion.div>
          )}

          {/* Result Display */}
          {shortenedUrl && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-6 bg-primary/5 rounded-lg border-2 border-primary/20"
            >
              <p className="text-sm font-medium text-foreground mb-3">Your shortened URL:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background rounded-md p-3 border border-border">
                  <a
                    href={shortenedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {shortenedUrl}
                  </a>
                </div>
                <Button type="button" size="icon" variant="outline" onClick={handleCopy} className="h-12 w-12 shrink-0">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* History Section */}
        <motion.div variants={itemVariants} className="mt-6">
          <Button
            variant="ghost"
            onClick={toggleHistory}
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <History className="w-4 h-4" />
            View History ({historyItems.length > 0 ? historyItems.length : "..."})
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4 overflow-hidden"
              >
                {historyItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No history found.</p>
                ) : (
                  historyItems.map((item, index) => {
                    // Calculate sequential number based on user's history
                    // History is ordered by created_at descending (newest first)
                    // So we reverse the index to get sequential numbering (oldest = 1, newest = highest)
                    const totalCount = historyItems.length;
                    const sequentialNumber = totalCount - index;
                    
                    const originalUrl = item.original_url || item.url || "";
                    const shortUrl = item.shortened_url || item.short_url || item.tiny_url || "";
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card rounded-lg border border-border p-4"
                      >
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted px-2 py-1 rounded">{sequentialNumber}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* Original URL */}
                          {originalUrl && (
                            <div className="bg-background rounded-lg border border-border/60 p-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Original URL:</p>
                              <div className="flex items-center gap-2">
                                <a
                                  href={originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline break-all flex-1"
                                >
                                  {originalUrl}
                                </a>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyHistory(originalUrl)}
                                  className="shrink-0"
                                >
                                  {copiedHistoryUrl === originalUrl ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Shortened URL */}
                          {shortUrl && (
                            <div className="bg-primary/5 rounded-lg border-2 border-primary/20 p-4">
                              <p className="text-xs font-medium text-foreground mb-2">Shortened URL:</p>
                              <div className="flex items-center gap-2">
                                <a
                                  href={shortUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline break-all flex-1 font-semibold"
                                >
                                  {shortUrl}
                                </a>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyHistory(shortUrl)}
                                  className="shrink-0"
                                >
                                  {copiedHistoryUrl === shortUrl ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-sm text-muted-foreground">Instant URL shortening powered by automation</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Easy Sharing</h3>
            <p className="text-sm text-muted-foreground">Copy and share your shortened links anywhere</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Clean Links</h3>
            <p className="text-sm text-muted-foreground">Professional, shortened URLs for better engagement</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TinyUrl;

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, FileText, AlertCircle, Linkedin, Twitter, Instagram, Image as ImageIcon, Copy, Check, History, ChevronDown, ChevronUp, Share2, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/lib/externalSupabase";

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/webhook/5bb1b970-7ba5-4663-9777-ba5686af6104";
const TIMER_DURATION = 90; // 1:30 in seconds

interface ContentRepurpose {
  id: number;
  created_at: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  image_url?: string;
  youtube_url?: string;
  [key: string]: any;
}

const YoutubePost = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [contentData, setContentData] = useState<ContentRepurpose | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<ContentRepurpose[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submissionTimestampRef = useRef<string | null>(null);
  const submittedUrlRef = useRef<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLatestContent = async (afterTimestamp: string | null, youtubeUrl: string): Promise<ContentRepurpose | null> => {
    try {
      // Only fetch content if user is logged in
      if (!user?.id && !user?.email) {
        return null;
      }

      // Build query - apply filter first, then order
      let query = externalSupabase
        .from("content_repurpose")
        .select("*");

      // Filter by user_id and user_email - only show records for logged-in user
      if (user?.id && user?.email) {
        // If both ID and email exist, filter by both (OR condition)
        query = query.or(`user_id.eq.${user.id},user_email.eq.${user.email}`);
      } else if (user?.id) {
        query = query.eq("user_id", user.id);
      } else if (user?.email) {
        query = query.eq("user_email", user.email);
      }

      // If we have a timestamp, filter for posts created after it
      // Subtract 5 seconds as a buffer to account for any timing differences
      if (afterTimestamp) {
        const timestampDate = new Date(afterTimestamp);
        timestampDate.setSeconds(timestampDate.getSeconds() - 5);
        const bufferedTimestamp = timestampDate.toISOString();
        query = query.gt("created_at", bufferedTimestamp);
      }

      // Apply ordering and limit
      query = query.order("created_at", { ascending: false }).limit(1);

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Error fetching content:", error);
        // If query fails, try fetching all and filter in JavaScript
        let fallbackQuery = externalSupabase
          .from("content_repurpose")
          .select("*");
        
        if (afterTimestamp) {
          const timestampDate = new Date(afterTimestamp);
          timestampDate.setSeconds(timestampDate.getSeconds() - 5);
          const bufferedTimestamp = timestampDate.toISOString();
          fallbackQuery = fallbackQuery.gt("created_at", bufferedTimestamp);
        }
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (fallbackError) {
          console.error("Fallback query error:", fallbackError);
          return null;
        }
        
        // Filter in JavaScript - only show records matching user
        if (fallbackData && (user?.id || user?.email)) {
          if (fallbackData.user_id !== user?.id && fallbackData.user_email !== user?.email) {
            return null; // Not user's content
          }
        }
        
        return fallbackData;
      }

      return data;
    } catch (err) {
      console.error("Error in fetchLatestContent:", err);
      return null;
    }
  };

  const fetchAndDisplayLatestContent = useCallback(async () => {
    setIsLoading(true);
    console.log("Fetching latest content...", {
      timestamp: submissionTimestampRef.current,
      url: submittedUrlRef.current,
      userId: user?.id,
      userEmail: user?.email
    });
    
    const latestContent = await fetchLatestContent(
      submissionTimestampRef.current,
      submittedUrlRef.current
    );
    
    console.log("Fetched content:", latestContent);
    
    if (latestContent) {
      setContentData(latestContent);
      setIsLoading(false);
      setCountdown(null); // Clear countdown to unlock form
      toast({
        title: "Success!",
        description: "Your posts are ready!",
      });
    } else {
      setIsLoading(false);
      setCountdown(null); // Clear countdown to unlock form even on error
      toast({
        title: "No content found",
        description: "Could not fetch the latest posts. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, user]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) {
            return null;
          }
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // Timer ended, fetch latest content
            fetchAndDisplayLatestContent();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [countdown, fetchAndDisplayLatestContent]);

  const fetchHistory = async () => {
    // Only fetch history if user is logged in
    if (!user?.id && !user?.email) {
      setHistoryItems([]);
      return;
    }

    let query = externalSupabase
      .from("content_repurpose")
      .select("*");

    // Filter by user_id and user_email - only show records for logged-in user
    if (user?.id && user?.email) {
      // If both ID and email exist, filter by both (OR condition)
      query = query.or(`user_id.eq.${user.id},user_email.eq.${user.email}`);
    } else if (user?.id) {
      query = query.eq("user_id", user.id);
    } else if (user?.email) {
      query = query.eq("user_email", user.email);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching history:", error);
      // If query fails, try fetching all and filter in JavaScript
      console.log("Attempting fallback: fetching all history");
      const fallbackQuery = externalSupabase
        .from("content_repurpose")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50); // Fetch more to filter
      
      const fallbackResult = await fallbackQuery;
      if (fallbackResult.error) {
        console.error("Fallback query also failed:", fallbackResult.error);
        setHistoryItems([]);
        return;
      }
      
      // Filter in JavaScript - only show records matching user
      let filteredItems = fallbackResult.data || [];
      if (user?.id || user?.email) {
        filteredItems = filteredItems.filter((item: ContentRepurpose) => 
          item.user_id === user?.id || 
          item.user_email === user?.email
        );
      }
      
      setHistoryItems(filteredItems.slice(0, 10));
      return;
    }
    
    setHistoryItems(data || []);
  };


  const handleCopy = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatform(platform);
      toast({
        title: "Copied!",
        description: `${platform} post copied to clipboard.`,
      });
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded!",
        description: "Image downloaded successfully.",
      });
    } catch {
      toast({
        title: "Failed to download",
        description: "Please download the image manually.",
        variant: "destructive",
      });
    }
  };

  const handleCopyImageUrl = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      toast({
        title: "Copied!",
        description: "Image URL copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleShareToLinkedIn = (text: string) => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleShareToTwitter = (text: string) => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleShareToInstagram = async (text: string) => {
    // Instagram doesn't support direct sharing via URL, so we copy the text
    await handleCopy(text, "Instagram");
    toast({
      title: "Copied!",
      description: "Post text copied. Paste it in Instagram with your image.",
    });
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

  const isValidYouTubeUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      const hostname = url.hostname.toLowerCase();
      return (
        (hostname === "youtube.com" || hostname === "www.youtube.com" || hostname === "youtu.be") &&
        (urlString.includes("/watch?v=") || urlString.includes("youtu.be/"))
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError("Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)");
      return;
    }

    setIsLoading(true);
    setContentData(null);
    setCountdown(null);

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset submission tracking refs
    submissionTimestampRef.current = null;
    submittedUrlRef.current = "";

    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      formData.append("youtubeUrl", youtubeUrl);

      // Add user information if logged in
      if (user?.id) {
        formData.append("userId", user.id);
      }
      if (user?.email) {
        formData.append("userEmail", user.email);
      }

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        // Don't set Content-Type header - browser will set it automatically with boundary for FormData
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errorMessage || "Failed to submit YouTube URL");
      }

      toast({
        title: "Success!",
        description: "Your post is being processed. We'll fetch the results in 1:30.",
      });

      // Store submission timestamp and URL to fetch the correct post later
      submissionTimestampRef.current = new Date().toISOString();
      submittedUrlRef.current = youtubeUrl;

      // Start the 1:30 timer
      setIsLoading(false);
      setCountdown(TIMER_DURATION);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setIsLoading(false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Youtube className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            YouTube to Post
          </h1>
          <p className="text-muted-foreground text-lg">Transform your YouTube videos into engaging social media posts</p>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="youtubeUrl" className="text-sm font-medium text-foreground">
                Enter your YouTube URL
              </label>
              <Input
                id="youtubeUrl"
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="h-12 text-base"
                disabled={isLoading || (countdown !== null && countdown > 0)}
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

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 text-base font-semibold" 
              disabled={isLoading || (countdown !== null && countdown > 0)}
            >
              {isLoading || (countdown !== null && countdown > 0) ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                  <span className="ml-2">
                    {isLoading ? "Processing..." : `Waiting... (${Math.floor((countdown || 0) / 60)}:${((countdown || 0) % 60).toString().padStart(2, "0")})`}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span className="ml-2">Generate Post</span>
                </>
              )}
            </Button>
          </form>

          {/* Timer Display */}
          {countdown !== null && countdown > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 p-6 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-primary animate-pulse" />
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-1">Fetching posts in...</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && !contentData && countdown === null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 p-4 bg-muted/50 rounded-lg border border-border"
            >
              <p className="text-muted-foreground text-center">Fetching your posts...</p>
            </motion.div>
          )}

          {/* Content Results */}
          {contentData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Generated Posts</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setContentData(null);
                    setYoutubeUrl("");
                    setError("");
                  }}
                >
                  Generate New
                </Button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* LinkedIn Card */}
                {(contentData.linkedin || contentData.linkedin_post || contentData.linkedIn) && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                      <span className="text-sm font-bold bg-blue-500 text-primary-foreground px-3 py-1 rounded-md">
                        LinkedIn
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{contentData.linkedin || contentData.linkedin_post || contentData.linkedIn}</p>
                    <div className="flex gap-2 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareToLinkedIn((contentData.linkedin || contentData.linkedin_post || contentData.linkedIn)!)}
                        className="flex-1"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy((contentData.linkedin || contentData.linkedin_post || contentData.linkedIn)!, "LinkedIn")}
                        className="flex-1"
                      >
                        {copiedPlatform === "LinkedIn" ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Twitter Card */}
                {(contentData.twitter || contentData.twitter_post) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                      <span className="text-sm font-bold bg-sky-500 text-primary-foreground px-3 py-1 rounded-md">
                        Twitter
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{contentData.twitter || contentData.twitter_post}</p>
                    <div className="flex gap-2 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareToTwitter((contentData.twitter || contentData.twitter_post)!)}
                        className="flex-1"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy((contentData.twitter || contentData.twitter_post)!, "Twitter")}
                        className="flex-1"
                      >
                        {copiedPlatform === "Twitter" ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Instagram Card */}
                {(contentData.instagram || contentData.instagram_post) && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                      <span className="text-sm font-bold bg-pink-500 text-primary-foreground px-3 py-1 rounded-md">
                        Instagram
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{contentData.instagram || contentData.instagram_post}</p>
                    <div className="flex gap-2 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareToInstagram((contentData.instagram || contentData.instagram_post)!)}
                        className="flex-1"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy((contentData.instagram || contentData.instagram_post)!, "Instagram")}
                        className="flex-1"
                      >
                        {copiedPlatform === "Instagram" ? (
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        Copy
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Image Card */}
                {(contentData.image_url || contentData.image) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                      <span className="text-sm font-bold bg-purple-500 text-primary-foreground px-3 py-1 rounded-md">
                        Image
                      </span>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-border/50 mb-3">
                      <img
                        src={contentData.image_url || contentData.image}
                        alt="Generated content"
                        className="w-full h-auto object-contain max-h-[600px]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadImage(contentData.image_url || contentData.image!)}
                        className="flex-1 min-w-[100px]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyImageUrl(contentData.image_url || contentData.image!)}
                        className="flex-1 min-w-[100px]"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </Button>
                      {contentData.linkedin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareToLinkedIn(contentData.linkedin || contentData.linkedin_post || contentData.linkedIn || "")}
                          className="flex-1 min-w-[100px]"
                        >
                          <Linkedin className="w-4 h-4 mr-2 text-blue-500" />
                          Share
                        </Button>
                      )}
                      {contentData.twitter && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareToTwitter(contentData.twitter || contentData.twitter_post || "")}
                          className="flex-1 min-w-[100px]"
                        >
                          <Twitter className="w-4 h-4 mr-2 text-sky-500" />
                          Share
                        </Button>
                      )}
                      {contentData.instagram && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareToInstagram(contentData.instagram || contentData.instagram_post || "")}
                          className="flex-1 min-w-[100px]"
                        >
                          <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                          Share
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info Cards */}
        {!contentData && (
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <h3 className="font-semibold mb-2">Fast & Reliable</h3>
              <p className="text-sm text-muted-foreground">Instant post generation powered by automation</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <h3 className="font-semibold mb-2">Easy Sharing</h3>
              <p className="text-sm text-muted-foreground">Copy and share your generated posts anywhere</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <h3 className="font-semibold mb-2">Engaging Content</h3>
              <p className="text-sm text-muted-foreground">Professional, optimized posts for better engagement</p>
            </div>
          </motion.div>
        )}

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
                          {item.youtube_url && (
                            <a
                              href={item.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Youtube className="w-3 h-3" />
                              View Source
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {(item.linkedin || item.linkedin_post || item.linkedIn) && (
                          <div className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                              <span className="text-sm font-bold bg-blue-500 text-primary-foreground px-3 py-1 rounded-md">
                                LinkedIn
                              </span>
                            </div>
                            <p className="text-xs text-foreground line-clamp-3 mb-2">{item.linkedin || item.linkedin_post || item.linkedIn}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => handleCopy((item.linkedin || item.linkedin_post || item.linkedIn)!, `LinkedIn-${item.id}`)}
                            >
                              {copiedPlatform === `LinkedIn-${item.id}` ? (
                                <Check className="w-3 h-3 mr-2 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 mr-2" />
                              )}
                              Copy
                            </Button>
                          </div>
                        )}

                        {(item.twitter || item.twitter_post) && (
                          <div className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                              <span className="text-sm font-bold bg-sky-500 text-primary-foreground px-3 py-1 rounded-md">
                                Twitter
                              </span>
                            </div>
                            <p className="text-xs text-foreground line-clamp-3 mb-2">{item.twitter || item.twitter_post}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => handleCopy((item.twitter || item.twitter_post)!, `Twitter-${item.id}`)}
                            >
                              {copiedPlatform === `Twitter-${item.id}` ? (
                                <Check className="w-3 h-3 mr-2 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 mr-2" />
                              )}
                              Copy
                            </Button>
                          </div>
                        )}

                        {(item.instagram || item.instagram_post) && (
                          <div className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                              <span className="text-sm font-bold bg-pink-500 text-primary-foreground px-3 py-1 rounded-md">
                                Instagram
                              </span>
                            </div>
                            <p className="text-xs text-foreground line-clamp-3 mb-2">{item.instagram || item.instagram_post}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => handleCopy((item.instagram || item.instagram_post)!, `Instagram-${item.id}`)}
                            >
                              {copiedPlatform === `Instagram-${item.id}` ? (
                                <Check className="w-3 h-3 mr-2 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 mr-2" />
                              )}
                              Copy
                            </Button>
                          </div>
                        )}

                        {(item.image_url || item.image) && (
                          <div className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                              <span className="text-sm font-bold bg-purple-500 text-primary-foreground px-3 py-1 rounded-md">
                                Image
                              </span>
                            </div>
                            <div className="rounded overflow-hidden border border-border/50 mb-2">
                              <img
                                src={item.image_url || item.image}
                                alt="Generated content"
                                className="w-full h-auto object-contain max-h-48"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleDownloadImage(item.image_url || item.image!)}
                            >
                              <Download className="w-3 h-3 mr-2" />
                              Download
                            </Button>
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
      </motion.div>
    </div>
  );
};

export default YoutubePost;

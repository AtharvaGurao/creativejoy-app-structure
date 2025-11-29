import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, AlertCircle, CheckCircle, RefreshCw, History, ExternalLink, Copy, Trash2, Calendar, Hash, MessageSquare, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { runShorts, queryTaskStatus } from "@/api/runShorts";
import { saveShortsHistory, getShortsHistory, deleteShortsHistoryItem, type ShortsHistoryItem } from "@/lib/history";

const Shorts = () => {
  const [videoIdea, setVideoIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ 
    jobId?: string; 
    status?: string; 
    message?: string; 
    result?: any;
    resultUrls?: string[];
    resultWaterMarkUrls?: string[];
    failCode?: string;
    failMsg?: string;
    prompt?: string; // Store the prompt used for this task
  } | null>(null);
  const [error, setError] = useState("");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<ShortsHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTaskInProgress, setIsTaskInProgress] = useState(false);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Save to history when URLs are available
  useEffect(() => {
    const saveHistory = async () => {
      if (result?.jobId && result?.resultUrls && result.resultUrls.length > 0 && !savedToHistory && result.prompt) {
        try {
          const success = await saveShortsHistory({
            taskId: result.jobId,
            prompt: result.prompt,
            videoUrls: result.resultUrls || [],
            watermarkedUrls: result.resultWaterMarkUrls || [],
            status: result.status || 'success',
            model: 'sora-2-text-to-video',
            userId: user?.id || null,
            userEmail: user?.email || null,
          });
          if (success) {
            setSavedToHistory(true);
            console.log('Saved to history:', result.jobId);
            toast({
              title: "Saved to History",
              description: "Your video has been saved to history.",
            });
          }
        } catch (error) {
          console.error('Error saving to history:', error);
          toast({
            title: "History Save Failed",
            description: "Could not save to history, but your video is still available.",
            variant: "destructive",
          });
        }
      }
    };

    saveHistory();
  }, [result?.resultUrls, result?.jobId, result?.prompt, savedToHistory, toast, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSavedToHistory(false); // Reset saved flag for new submission

    if (!videoIdea.trim()) {
      setError("Please enter a video idea");
      return;
    }

    setIsLoading(true);

    try {
      const response = await runShorts({ 
        videoIdea: videoIdea.trim(),
        aspectRatio: 'portrait', // YouTube Shorts are typically portrait
        nFrames: 10
      });

      if (response.success && response.data) {
        const taskId = response.data.jobId;
        setResult({
          ...response.data,
          prompt: videoIdea.trim(), // Store the prompt with the result
        });
        
        // Lock inputs and start auto-refresh
        setIsTaskInProgress(true);
        setIsLoading(false); // Form submission is done, but task is in progress
        
        toast({
          title: "Task Created!",
          description: "Your YouTube Short task has been created. Checking status automatically...",
        });

        // Start auto-refreshing status every 5 seconds
        if (taskId) {
          startAutoRefresh(taskId);
        }
      } else {
        throw new Error(response.error || "Failed to create YouTube Short");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setIsTaskInProgress(false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh task status every 5 seconds
  const startAutoRefresh = (taskId: string) => {
    // Clear any existing interval
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }

    // Start checking status every 5 seconds
    statusCheckIntervalRef.current = setInterval(async () => {
      try {
        const response = await queryTaskStatus(taskId);

        if (response.success && response.data) {
          const newStatus = response.data.status;
          const hasUrls = response.data.resultUrls && response.data.resultUrls.length > 0;

          // Update result with latest data
          setResult(prev => prev ? {
            ...prev,
            status: newStatus || prev.status,
            result: response.data?.result,
            resultUrls: response.data?.resultUrls || prev.resultUrls,
            resultWaterMarkUrls: response.data?.resultWaterMarkUrls || prev.resultWaterMarkUrls,
            failCode: response.data?.failCode,
            failMsg: response.data?.failMsg,
            prompt: prev.prompt, // Preserve the original prompt
            ...response.data
          } : null);

          // If task is complete (success state) or failed, stop refreshing and unlock inputs
          if (newStatus === 'success' || hasUrls || newStatus === 'failed' || response.data?.failMsg) {
            stopAutoRefresh();
            setIsTaskInProgress(false);
            
            if (newStatus === 'success' || hasUrls) {
              setVideoIdea(""); // Clear the textarea only on success
              toast({
                title: "Task Complete!",
                description: "Your YouTube Short is ready!",
              });
            } else if (newStatus === 'failed' || response.data?.failMsg) {
              toast({
                title: "Task Failed",
                description: response.data?.failMsg || "The task failed to complete.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
        // Don't stop on error, keep trying
      }
    }, 5000); // Check every 5 seconds
  };

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, []);

  const handleCheckStatus = async () => {
    if (!result?.jobId) {
      toast({
        title: "Error",
        description: "No task ID available to check status",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingStatus(true);
    setError("");

    try {
      const response = await queryTaskStatus(result.jobId);

      if (response.success && response.data) {
        const newStatus = response.data.status;
        const hasUrls = response.data.resultUrls && response.data.resultUrls.length > 0;

        setResult(prev => prev ? {
          ...prev,
          status: newStatus || prev.status,
          result: response.data?.result,
          resultUrls: response.data?.resultUrls || prev.resultUrls,
          resultWaterMarkUrls: response.data?.resultWaterMarkUrls || prev.resultWaterMarkUrls,
          failCode: response.data?.failCode,
          failMsg: response.data?.failMsg,
          prompt: prev.prompt, // Preserve the original prompt
          ...response.data
        } : null);

        // If task is complete, stop auto-refresh and unlock inputs
        if (newStatus === 'success' || hasUrls) {
          stopAutoRefresh();
          setIsTaskInProgress(false);
          setVideoIdea(""); // Clear the textarea
          toast({
            title: "Task Complete!",
            description: "Your YouTube Short is ready!",
          });
        } else {
          toast({
            title: "Status Updated",
            description: `Task status: ${newStatus || 'Unknown'}`,
          });
        }
      } else {
        throw new Error(response.error || "Failed to query task status");
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
      setIsCheckingStatus(false);
    }
  };

  // Fetch history from Supabase (filtered by user if logged in)
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const items = await getShortsHistory(user?.id || null, user?.email || null);
      setHistoryItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryItems([]); // Ensure we always have an array
      toast({
        title: "Error",
        description: "Failed to load history.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history when showing history tab
  useEffect(() => {
    if (showHistory) {
      fetchHistory().catch((error) => {
        console.error('Failed to fetch history:', error);
        // Set empty array to prevent blank page
        setHistoryItems([]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard.",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHistory = async (id: number) => {
    try {
      const success = await deleteShortsHistoryItem(id, user?.id || null, user?.email || null);
      if (success) {
        await fetchHistory();
        toast({
          title: "Deleted",
          description: "History item removed.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete history item. You may not have permission.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete history item.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            YouTube Shorts Maker
          </h1>
          <p className="text-muted-foreground text-lg">Create engaging YouTube Shorts automatically with AI-powered video generation</p>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="videoIdea" className="text-sm font-medium text-foreground">
                Share your video idea
              </label>
              <Input
                id="videoIdea"
                type="text"
                placeholder="Enter your creative video idea here..."
                value={videoIdea}
                onChange={(e) => setVideoIdea(e.target.value)}
                className="h-12 text-base"
                disabled={isLoading || isTaskInProgress}
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

            <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" disabled={isLoading || isTaskInProgress}>
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                  <span className="ml-2">Creating your Short...</span>
                </>
              ) : isTaskInProgress ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                  <span className="ml-2">Processing... (Auto-checking status)</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span className="ml-2">Create Short</span>
                </>
              )}
            </Button>
          </form>

          {/* Loading State */}
          {(isLoading || isTaskInProgress) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 p-4 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                />
                <p className="text-muted-foreground text-center">
                  {isTaskInProgress ? "Your YouTube Short is being processed... (Auto-checking every 5 seconds)" : "Your YouTube Short is being processed..."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Result Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-6 bg-primary/5 rounded-lg border-2 border-primary/20"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      {result.message || "Your YouTube Short task has been created!"}
                    </p>
                    {result.jobId && (
                      <div className="bg-background rounded-md p-3 border border-border mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Task ID:</p>
                        <p className="text-sm font-mono text-foreground break-all">{result.jobId}</p>
                      </div>
                    )}
                    {result.status && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Status:</p>
                        <p className="text-sm font-medium text-foreground capitalize">{result.status}</p>
                      </div>
                    )}
                    {(result.resultUrls && result.resultUrls.length > 0) || (result.resultWaterMarkUrls && result.resultWaterMarkUrls.length > 0) || result.result ? (
                      <div className="bg-background rounded-md p-3 border border-border mb-3">
                        <p className="text-xs text-muted-foreground mb-2">Video Results:</p>
                        {result.resultUrls && result.resultUrls.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Video URLs:</p>
                            <div className="space-y-2">
                              {result.resultUrls.map((url: string, index: number) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-primary hover:underline break-all"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.resultWaterMarkUrls && result.resultWaterMarkUrls.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Watermarked Video URLs:</p>
                            <div className="space-y-2">
                              {result.resultWaterMarkUrls.map((url: string, index: number) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-primary hover:underline break-all"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.result && !result.resultUrls && !result.resultWaterMarkUrls && (
                          <div>
                            {typeof result.result === 'string' ? (
                              <p className="text-sm text-foreground break-all">{result.result}</p>
                            ) : result.result.url ? (
                              <a
                                href={result.result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline break-all"
                              >
                                {result.result.url}
                              </a>
                            ) : (
                              <pre className="text-xs text-foreground overflow-auto">
                                {JSON.stringify(result.result, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                    {result.failMsg && (
                      <div className="bg-destructive/10 rounded-md p-3 border border-destructive/20 mb-3">
                        <p className="text-xs text-destructive font-medium mb-1">Error:</p>
                        <p className="text-sm text-destructive">{result.failMsg}</p>
                        {result.failCode && (
                          <p className="text-xs text-destructive/70 mt-1">Error Code: {result.failCode}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isTaskInProgress && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCheckStatus}
                        disabled={isCheckingStatus || !result.jobId}
                        className="flex-1"
                      >
                        {isCheckingStatus ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                            />
                            <span className="ml-2">Checking...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            <span className="ml-2">Check Status</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {isTaskInProgress && (
                    <p className="text-xs text-muted-foreground">
                      Status is being checked automatically every 5 seconds...
                    </p>
                  )}
                  {!isTaskInProgress && !result.resultUrls && !result.resultWaterMarkUrls && result.status !== 'success' && (
                    <p className="text-xs text-muted-foreground">
                      Your video is being processed. Click "Check Status" to see the latest updates.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">Leverage advanced AI to generate engaging Shorts content</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Quick Creation</h3>
            <p className="text-sm text-muted-foreground">Transform your ideas into YouTube Shorts in minutes</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Viral Potential</h3>
            <p className="text-sm text-muted-foreground">Optimized for maximum engagement and reach</p>
          </div>
        </motion.div>

        {/* History Section */}
        <motion.div variants={itemVariants} className="mt-8">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            className="w-full mb-4"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? "Hide History" : "Show History"}
          </Button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                key="history-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {isLoadingHistory ? (
                  <div className="bg-card rounded-xl shadow-sm border border-border/50 p-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
                    />
                    <p className="text-muted-foreground">Loading history...</p>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="bg-card rounded-xl shadow-sm border border-border/50 p-8 text-center">
                    <p className="text-muted-foreground">No history found.</p>
                  </div>
                ) : (
                  historyItems
                    .filter((item) => item && typeof item.id === 'number')
                    .map((item, index) => {
                      // Calculate sequential number based on user's history
                      // History is ordered by created_at descending (newest first)
                      // So we reverse the index to get sequential numbering (oldest = 1, newest = highest)
                      const totalCount = historyItems.filter((i) => i && typeof i.id === 'number').length;
                      const sequentialNumber = totalCount - index;
                      
                      return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card rounded-xl shadow-sm border border-border/50 p-5 md:p-6 hover:shadow-md transition-shadow"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-4 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted/60 px-2.5 py-1 rounded-md">
                              {sequentialNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3.5">
                          {/* Task ID */}
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Hash className="w-3.5 h-3.5" />
                              Task ID
                            </label>
                            <div className="h-10 px-3.5 rounded-lg border border-input bg-background flex items-center text-sm font-mono text-foreground">
                              <span className="truncate">{item.task_id}</span>
                            </div>
                          </div>

                          {/* Prompt */}
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Prompt
                            </label>
                            <div className="min-h-[3rem] px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground leading-relaxed">
                              {item.prompt}
                            </div>
                          </div>

                        {/* Video URL */}
                        {item.video_url && (
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Link2 className="w-3.5 h-3.5" />
                              Video URL
                            </label>
                            <div className="flex items-start gap-2">
                              <div 
                                className="flex-1 min-h-10 px-3.5 py-2 rounded-lg border border-input bg-background break-words overflow-hidden"
                                title={item.video_url}
                              >
                                <span className="text-sm text-foreground break-all font-mono leading-relaxed block">{item.video_url}</span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(item.video_url!, `${item.id}-video`)}
                                  className="h-10 w-10 hover:bg-primary/10"
                                  title="Copy URL"
                                >
                                  {copiedId === `${item.id}-video` ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="h-10 w-10 hover:bg-primary/10"
                                  title="Open in new tab"
                                >
                                  <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Watermarked Video URL */}
                        {item.watermark_video_url && (
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Link2 className="w-3.5 h-3.5" />
                              Watermarked Video URL
                            </label>
                            <div className="flex items-start gap-2">
                              <div 
                                className="flex-1 min-h-10 px-3.5 py-2 rounded-lg border border-input bg-background break-words overflow-hidden"
                                title={item.watermark_video_url}
                              >
                                <span className="text-sm text-foreground break-all font-mono leading-relaxed block">{item.watermark_video_url}</span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(item.watermark_video_url!, `${item.id}-watermark`)}
                                  className="h-10 w-10 hover:bg-primary/10"
                                  title="Copy URL"
                                >
                                  {copiedId === `${item.id}-watermark` ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="h-10 w-10 hover:bg-primary/10"
                                  title="Open in new tab"
                                >
                                  <a href={item.watermark_video_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                  </a>
                                </Button>
                              </div>
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
      </motion.div>
    </div>
  );
};

export default Shorts;

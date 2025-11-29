import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Trash2, ExternalLink, Copy, Check, Calendar, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getShortsHistory, deleteShortsHistoryItem, clearShortsHistory, type ShortsHistoryItem } from "@/lib/history";

const History = () => {
  const [historyItems, setHistoryItems] = useState<ShortsHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const items = await getShortsHistory();
      setHistoryItems(items);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: "Error",
        description: "Failed to load history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const success = await deleteShortsHistoryItem(id);
      if (success) {
        await loadHistory();
        toast({
          title: "Deleted",
          description: "History item removed.",
        });
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete history item.",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      try {
        const success = await clearShortsHistory();
        if (success) {
          await loadHistory();
          toast({
            title: "Cleared",
            description: "All history has been cleared.",
          });
        } else {
          throw new Error('Clear failed');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to clear history.",
          variant: "destructive",
        });
      }
    }
  };

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

  const formatDate = (timestamp: string | number) => {
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            History
          </h1>
          <p className="text-muted-foreground text-lg">Your saved YouTube Shorts results</p>
        </motion.div>

        {/* Actions */}
        {historyItems.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6 flex justify-end">
            <Button variant="outline" onClick={handleClearAll} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </motion.div>
        )}

        {/* History Items */}
        {isLoading ? (
          <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-lg border border-border p-12 text-center">
            <FileVideo className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold mb-2">Loading history...</h3>
          </motion.div>
        ) : historyItems.length === 0 ? (
          <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-lg border border-border p-12 text-center">
            <FileVideo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground">
              Your YouTube Shorts results will appear here once videos are generated.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="bg-card rounded-2xl shadow-lg border border-border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Task ID:</p>
                    <p className="text-xs font-mono text-muted-foreground mb-4 break-all">{item.task_id}</p>
                    <p className="text-sm font-medium text-foreground mb-2">Prompt:</p>
                    <p className="text-sm text-muted-foreground mb-4">{item.prompt}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Video URL */}
                {item.video_url && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Video URL:</p>
                    <div className="flex items-center gap-2 bg-background rounded-md p-3 border border-border">
                      <a
                        href={item.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-primary hover:underline break-all"
                      >
                        {item.video_url}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(item.video_url!, `${item.id}-video`)}
                        className="h-8 w-8 shrink-0"
                      >
                        {copiedId === `${item.id}-video` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 shrink-0"
                      >
                        <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Watermarked URL */}
                {item.watermark_video_url && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Watermarked Video URL:</p>
                    <div className="flex items-center gap-2 bg-background rounded-md p-3 border border-border">
                      <a
                        href={item.watermark_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-primary hover:underline break-all"
                      >
                        {item.watermark_video_url}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(item.watermark_video_url!, `${item.id}-watermark`)}
                        className="h-8 w-8 shrink-0"
                      >
                        {copiedId === `${item.id}-watermark` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 shrink-0"
                      >
                        <a href={item.watermark_video_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {!item.video_url && !item.watermark_video_url && (
                  <p className="text-sm text-muted-foreground">No video URLs available yet.</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default History;

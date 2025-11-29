import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, AlertCircle, Upload, X, Download, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { runViralScript } from "@/api/runViralScript";
import { externalSupabase } from "@/lib/externalSupabase";

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/webhook/7ed18408-6875-42b5-9919-600eab579da2";

const Scripts = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [targetFormat, setTargetFormat] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [showLoadingCard, setShowLoadingCard] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(120);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        setError("");
      } else {
        setError("Please upload a valid video file");
        toast({
          title: "Error",
          description: "Please upload a valid video file",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        setError("");
      } else {
        setError("Please upload a valid video file");
        toast({
          title: "Error",
          description: "Please upload a valid video file",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveFile = () => {
    setVideoFile(null);
    const fileInput = document.getElementById("video") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    console.log("Form submitted", { videoFile, topic, isLoading });

    if (!videoFile) {
      setError("Please upload a viral video");
      toast({
        title: "Error",
        description: "Please upload a viral video",
        variant: "destructive",
      });
      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic");
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await runViralScript({
        videoFile,
        topic,
        targetFormat,
        brandVoice,
        targetAudience,
        followerCount: 0,
        webhookUrl: WEBHOOK_URL,
        userId: user?.id || null,
        userEmail: user?.email || null,
      });

      if (result.success) {
        // Hide form and show loading card
        setShowForm(false);
        setShowLoadingCard(true);
        setCountdown(120);
        
        // Start countdown timer
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              // Fetch results after 2 minutes
              fetchResults();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast({
          title: "Success!",
          description: "Your script is being processed. Please wait...",
        });
      } else {
        throw new Error(result.error || "Failed to generate script");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      // Reset form visibility on error
      setShowForm(true);
      setShowLoadingCard(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch results from Supabase (filtered by user if logged in)
  const fetchResults = async () => {
    try {
      let query = externalSupabase
        .from("video_content_requests")
        .select("*");

      // Filter by user if logged in
      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else if (user?.email) {
        query = query.eq("user_email", user.email);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching results:", error);
        toast({
          title: "Error",
          description: "Failed to fetch results. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        // Log the result to help debug field names
        console.log("Fetched result:", data[0]);
        console.log("PDF links:", {
          pdf_link_1: data[0].pdf_link_1,
          pdf_link_2: data[0].pdf_link_2,
          pdfLink1: data[0].pdfLink1,
          pdfLink2: data[0].pdfLink2,
          allKeys: Object.keys(data[0])
        });
        setResults(data);
        setShowLoadingCard(false);
      } else {
        // If no results, keep showing loading card or show a message
        toast({
          title: "No results yet",
          description: "Your script is still being processed. Please wait a bit longer.",
        });
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      toast({
        title: "Error",
        description: "Failed to fetch results.",
        variant: "destructive",
      });
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Fetch history from Supabase (filtered by user if logged in)
  const fetchHistory = async () => {
    try {
      let query = externalSupabase
        .from("video_content_requests")
        .select("*");

      // Filter by user if logged in
      if (user?.id) {
        query = query.eq("user_id", user.id);
      } else if (user?.email) {
        query = query.eq("user_email", user.email);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching history:", error);
        return;
      }

      setHistoryItems(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  // Load history when showing history tab or when user changes
  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, user]);

  // Download PDF function
  const handleDownloadPdf = async (url: string, filename: string) => {
    try {
      // Validate URL
      if (!url || !url.trim()) {
        throw new Error("Invalid PDF URL");
      }

      // Clean the URL
      const cleanUrl = url.trim();
      console.log("Downloading PDF from:", cleanUrl);

      // Try method 1: Fetch and create blob (for CORS-enabled URLs)
      try {
        const response = await fetch(cleanUrl, {
          method: "GET",
          headers: {
            "Accept": "application/pdf,application/octet-stream,*/*",
          },
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        console.log("Blob created:", blob.type, blob.size);
        
        // Check if it's actually a PDF
        if (blob.type && !blob.type.includes("pdf") && !blob.type.includes("octet-stream")) {
          console.warn("Response might not be a PDF:", blob.type);
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
        }, 100);

        toast({
          title: "Download started",
          description: `Downloading ${filename}`,
        });
        return;
      } catch (fetchError) {
        console.error("Fetch download failed:", fetchError);
        
        // Method 2: Try direct download link
        try {
          const link = document.createElement("a");
          link.href = cleanUrl;
          link.download = filename;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download started",
            description: `Downloading ${filename}`,
          });
          return;
        } catch (directError) {
          console.error("Direct download failed:", directError);
        }
        
        // Method 3: Open in new tab as fallback
        window.open(cleanUrl, "_blank", "noopener,noreferrer");
        toast({
          title: "Opening PDF",
          description: "PDF opened in new tab. Please use your browser's download option.",
        });
      }
    } catch (err) {
      console.error("Download error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Download failed",
        description: `Failed to download PDF: ${errorMessage}. The PDF link has been opened in a new tab.`,
        variant: "destructive",
      });
      
      // Last resort: open URL in new tab
      if (url) {
        window.open(url.trim(), "_blank", "noopener,noreferrer");
      }
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Viral Script Generator
          </h1>
          <p className="text-muted-foreground text-lg">Get your Viral Script In seconds</p>
        </motion.div>

        {/* Loading Card */}
        {showLoadingCard && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6"
          >
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Your script is in process, please wait…
              </h2>
              <p className="text-muted-foreground">
                Time remaining: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </motion.div>
        )}

        {/* Result Card - Single Card Only */}
        {results.length > 0 && !showLoadingCard && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6"
          >
            {(() => {
              const result = results[0];
              return (
                <div className="space-y-6">
                  {/* Topic */}
                  {(result.topic || result.Topic) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Topic</Label>
                      <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base">
                        {result.topic || result.Topic}
                      </div>
                    </div>
                  )}

                  {/* Target Format */}
                  {(result.target_format || result.targetFormat || result["Target Format"]) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Target Format</Label>
                      <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base capitalize">
                        {result.target_format || result.targetFormat || result["Target Format"]}
                      </div>
                    </div>
                  )}

                  {/* Brand Voice */}
                  {(result.brand_voice || result.brandVoice || result["Brand Voice"]) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Brand Voice</Label>
                      <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base capitalize">
                        {result.brand_voice || result.brandVoice || result["Brand Voice"]}
                      </div>
                    </div>
                  )}

                  {/* Target Audience */}
                  {(result.target_audience || result.targetAudience || result["Target Audience"]) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Target Audience</Label>
                      <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base">
                        {result.target_audience || result.targetAudience || result["Target Audience"]}
                      </div>
                    </div>
                  )}

                  {/* PDF Links */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <Button
                      onClick={() => handleDownloadPdf(results[0].pdf_link_1, "viral_script_1.pdf")}
                      className="w-full h-12 text-base font-semibold bg-[#EB6A5A] hover:bg-[#EB6A5A]/90 text-white"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF 1
                    </Button>

                    <Button
                      onClick={() => handleDownloadPdf(results[0].pdf_link_2, "viral_script_2.pdf")}
                      className="w-full h-12 text-base font-semibold bg-[#EB6A5A] hover:bg-[#EB6A5A]/90 text-white"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF 2
                    </Button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Form Card */}
        {showForm && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Upload Viral Video */}
            <div className="space-y-2">
              <Label htmlFor="video" className="text-sm font-medium text-foreground">
                Upload Viral Video <span className="text-destructive">*</span>
              </Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {videoFile ? (
                  <>
                    <input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isLoading}
                      required
                    />
                    <div className="flex items-center justify-between p-4">
                      <div 
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          if (!isLoading) {
                            document.getElementById("video")?.click();
                          }
                        }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{videoFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="flex-shrink-0 p-2 hover:bg-destructive/10 rounded-md transition-colors z-10 relative"
                        disabled={isLoading}
                        title="Remove file"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isLoading}
                      required
                    />
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        Drag and drop your video here
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">or</p>
                      <label
                        htmlFor="video"
                        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 cursor-pointer"
                      >
                        Choose File
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">No file chosen</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* What's Your Topic? */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium text-foreground">
                What's Your Topic?
              </Label>
              <Input
                id="topic"
                type="text"
                placeholder="Write your next video topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

            {/* Target Format */}
            <div className="space-y-2">
              <Label htmlFor="targetFormat" className="text-sm font-medium text-foreground">
                Target Format
              </Label>
              <Select value={targetFormat} onValueChange={setTargetFormat} disabled={isLoading}>
                <SelectTrigger id="targetFormat" className="h-12 text-base">
                  <SelectValue placeholder="Select an option ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="igtv">IGTV</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand Voice */}
            <div className="space-y-2">
              <Label htmlFor="brandVoice" className="text-sm font-medium text-foreground">
                Brand Voice
              </Label>
              <Select value={brandVoice} onValueChange={setBrandVoice} disabled={isLoading}>
                <SelectTrigger id="brandVoice" className="h-12 text-base">
                  <SelectValue placeholder="Select an option ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="trendy">Trendy</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-sm font-medium text-foreground">
                Target Audience
              </Label>
              <Input
                id="targetAudience"
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

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

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold bg-[#EB6A5A] hover:bg-[#EB6A5A]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </motion.div>
        )}

        {/* Info Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">AI-Powered Generation</h3>
            <p className="text-sm text-muted-foreground">Create viral-worthy scripts instantly with advanced AI technology</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Customizable Voice</h3>
            <p className="text-sm text-muted-foreground">Match your brand voice and target audience perfectly</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Multiple Formats</h3>
            <p className="text-sm text-muted-foreground">Generate scripts for Reels, Stories, IGTV, and Posts</p>
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
                className="space-y-4"
              >
              {historyItems.length === 0 ? (
                <div className="bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
                  <p className="text-muted-foreground">No history found.</p>
                </div>
              ) : (
                historyItems.map((item, index) => {
                  // Calculate sequential number based on user's history
                  // History is ordered by created_at descending (newest first)
                  // So we reverse the index to get sequential numbering (oldest = 1, newest = highest)
                  const totalCount = historyItems.length;
                  const sequentialNumber = totalCount - index;
                  
                  return (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl shadow-lg border border-border p-8"
                  >
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{sequentialNumber}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Topic */}
                      {item.topic && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">Topic</Label>
                          <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base">
                            {item.topic}
                          </div>
                        </div>
                      )}

                      {/* Target Format */}
                      {item.target_format && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">Target Format</Label>
                          <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base capitalize">
                            {item.target_format}
                          </div>
                        </div>
                      )}

                      {/* Brand Voice */}
                      {item.brand_voice && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">Brand Voice</Label>
                          <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base capitalize">
                            {item.brand_voice}
                          </div>
                        </div>
                      )}

                      {/* Target Audience */}
                      {item.target_audience && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">Target Audience</Label>
                          <div className="h-12 px-4 rounded-md border border-input bg-background flex items-center text-base">
                            {item.target_audience}
                          </div>
                        </div>
                      )}

                      {/* PDF Links */}
                      {(item.pdf_link_1 || item.pdf_link_2) && (
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                          {item.pdf_link_1 && (
                            <Button
                              onClick={() => handleDownloadPdf(item.pdf_link_1, `viral_script_1_${item.id}.pdf`)}
                              className="w-full h-12 text-base font-semibold bg-[#EB6A5A] hover:bg-[#EB6A5A]/90 text-white"
                              size="lg"
                            >
                              <Download className="w-5 h-5 mr-2" />
                              Download PDF 1
                            </Button>
                          )}
                          {item.pdf_link_2 && (
                            <Button
                              onClick={() => handleDownloadPdf(item.pdf_link_2, `viral_script_2_${item.id}.pdf`)}
                              className="w-full h-12 text-base font-semibold bg-[#EB6A5A] hover:bg-[#EB6A5A]/90 text-white"
                              size="lg"
                            >
                              <Download className="w-5 h-5 mr-2" />
                              Download PDF 2
                            </Button>
                          )}
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

export default Scripts;

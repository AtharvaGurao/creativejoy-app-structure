import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  AlertCircle,
  Database,
  MapPin,
  Search,
  Copy,
  Download,
  History,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { externalSupabase } from "@/lib/externalSupabase";

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/webhook/4db839f6-9c14-4a89-8ce7-a76406ff8156";
const POLL_INTERVAL = 3000;

interface InstagramLead {
  id: number;
  created_at: string;
  [key: string]: any;
}

// Helper to format field names (snake_case -> Title Case)
const formatFieldName = (key: string): string => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Helper to format field values
const formatFieldValue = (key: string, value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline truncate max-w-[200px] inline-block"
      >
        {value}
      </a>
    );
  }
  if (key === "username" && typeof value === "string" && !value.startsWith("@")) {
    return `@${value}`;
  }
  return String(value);
};

// Fields to exclude from dynamic display
const EXCLUDED_FIELDS = ["id", "created_at"];

const IgScraper = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [leadResult, setLeadResult] = useState<InstagramLead | null>(null);
  const [historyLeads, setHistoryLeads] = useState<InstagramLead[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const fetchLatestLead = async (): Promise<InstagramLead | null> => {
    const { data, error } = await externalSupabase
      .from("instagram_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching lead:", error);
      return null;
    }
    return data;
  };

  const fetchHistoryLeads = async () => {
    const { data, error } = await externalSupabase
      .from("instagram_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching history:", error);
      return;
    }
    setHistoryLeads(data || []);
  };

  const startPolling = (initialTimestamp: string | null) => {
    pollingRef.current = setInterval(async () => {
      const latestLead = await fetchLatestLead();

      if (latestLead) {
        const isNewLead = !initialTimestamp || new Date(latestLead.created_at) > new Date(initialTimestamp);

        if (isNewLead) {
          setLeadResult(latestLead);
          setIsLoading(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          toast({
            title: "Success!",
            description: "Your leads have been generated.",
          });
        }
      }
    }, POLL_INTERVAL);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLeadResult(null);

    if (!searchQuery.trim()) {
      setError("Please enter who you're looking for");
      return;
    }

    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }

    setIsLoading(true);

    try {
      const existingLead = await fetchLatestLead();
      const initialTimestamp = existingLead?.created_at || null;

      const formData = new FormData();
      formData.append("Who are you looking for?", searchQuery);
      formData.append("Location:", location);

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      startPolling(initialTimestamp);
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

  const handleCopyAll = async () => {
    if (!leadResult) return;
    const text = Object.entries(leadResult)
      .filter(([key]) => !EXCLUDED_FIELDS.includes(key))
      .map(([key, value]) => `${formatFieldName(key)}: ${value}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedType("all");
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: "Copied!", description: "Lead data copied to clipboard." });
  };

  const handleCopyJSON = async () => {
    if (!leadResult) return;
    await navigator.clipboard.writeText(JSON.stringify(leadResult, null, 2));
    setCopiedType("json");
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: "Copied!", description: "JSON copied to clipboard." });
  };

  const handleDownloadJSON = () => {
    if (!leadResult) return;
    const blob = new Blob([JSON.stringify(leadResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-${leadResult.id || Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Lead saved as JSON file." });
  };

  const toggleHistory = async () => {
    if (!showHistory) {
      await fetchHistoryLeads();
    }
    setShowHistory(!showHistory);
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

  // Get displayable fields from lead object
  const getDisplayableFields = (lead: InstagramLead) => {
    return Object.entries(lead).filter(
      ([key, value]) => !EXCLUDED_FIELDS.includes(key) && value !== null && value !== undefined && value !== "",
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Instagram Lead Scraper
          </h1>
          <p className="text-muted-foreground text-lg">Get all the leads from Instagram directly saved into Supabase</p>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="searchQuery" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                Who are you looking for?
              </label>
              <Input
                id="searchQuery"
                type="text"
                placeholder="Doctor, Shops, Restaurants, Dentist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 text-base"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Location
              </label>
              <Input
                id="location"
                type="text"
                placeholder="Name of the Location (Mumbai, Pune)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
                  <Users className="w-5 h-5" />
                  <span className="ml-2">Submit</span>
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
              <p className="text-muted-foreground text-center">Please wait… your leads are getting generated.</p>
            </motion.div>
          )}

          {/* Result Display - Dynamic Fields */}
          {leadResult && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-6 bg-primary/5 rounded-lg border-2 border-primary/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium text-foreground">Latest Lead Result</p>
              </div>

              <div className="space-y-1">
                {getDisplayableFields(leadResult).map(([key, value]) => (
                  <div
                    key={key}
                    className={`flex justify-between items-start py-2 border-b border-border/50 ${
                      typeof value === "string" && value.length > 50 ? "flex-col gap-1" : ""
                    }`}
                  >
                    <span className="text-sm text-muted-foreground">{formatFieldName(key)}</span>
                    <span className="text-sm font-medium text-foreground text-right">
                      {formatFieldValue(key, value)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 text-xs text-muted-foreground">
                  <span>Generated at</span>
                  <span>{new Date(leadResult.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={handleCopyAll} className="flex-1 min-w-[100px]">
                  {copiedType === "all" ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyJSON} className="flex-1 min-w-[100px]">
                  {copiedType === "json" ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copy JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadJSON} className="flex-1 min-w-[100px]">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* History Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <Button
            variant="ghost"
            onClick={toggleHistory}
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <History className="w-4 h-4" />
            View History ({historyLeads.length > 0 ? historyLeads.length : "..."})
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {historyLeads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No history found.</p>
                ) : (
                  historyLeads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleString()}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">#{lead.id}</span>
                      </div>
                      <div className="space-y-1">
                        {getDisplayableFields(lead)
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{formatFieldName(key)}</span>
                              <span className="font-medium truncate max-w-[150px]">{formatFieldValue(key, value)}</span>
                            </div>
                          ))}
                        {getDisplayableFields(lead).length > 4 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            +{getDisplayableFields(lead).length - 4} more fields
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Targeted Leads</h3>
            <p className="text-sm text-muted-foreground">Find leads based on business type and location</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Auto-Saved</h3>
            <p className="text-sm text-muted-foreground">All leads automatically saved to Supabase</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Real-Time</h3>
            <p className="text-sm text-muted-foreground">Results appear as soon as they're generated</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default IgScraper;

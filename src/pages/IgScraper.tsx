import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  AlertCircle,
  Database,
  MapPin,
  Search,
  Download,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/lib/externalSupabase";

const WEBHOOK_URL =
  "https://n8n.srv1116237.hstgr.cloud/webhook/13d740af-2c99-44d2-9ba7-c14a35007f07";
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
const EXCLUDED_FIELDS = ["id", "created_at", "position"];

const IgScraper = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [latestLeads, setLatestLeads] = useState<InstagramLead[]>([]);
  const [historyLeads, setHistoryLeads] = useState<InstagramLead[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const fetchLatestLead = async (): Promise<InstagramLead | null> => {
    // Only fetch lead if user is logged in
    if (!user?.id && !user?.email) {
      return null;
    }

    let query = externalSupabase
      .from("instagram_leads")
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
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching lead:", error);
      return null;
    }
    return data;
  };

  const fetchLatestLeads = async (limit = 10, sortByPosition = false): Promise<InstagramLead[]> => {
    // Only fetch leads if user is logged in
    if (!user?.id && !user?.email) {
      return [];
    }

    let query = externalSupabase
      .from("instagram_leads")
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
      .limit(limit);

    if (error) {
      console.error("Error fetching latest leads:", error);
      // If query fails, try fetching all leads and filter in JavaScript
      console.log("Attempting fallback: fetching all leads");
      const fallbackQuery = externalSupabase
        .from("instagram_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit * 2); // Fetch more to filter
      
      const fallbackResult = await fallbackQuery;
      if (fallbackResult.error) {
        console.error("Fallback query also failed:", fallbackResult.error);
        return [];
      }
      
      // Filter in JavaScript - only show records matching user
      let filteredLeads = fallbackResult.data || [];
      if (user?.id || user?.email) {
        filteredLeads = filteredLeads.filter((lead: InstagramLead) => 
          lead.user_id === user?.id || 
          lead.user_email === user?.email
        );
      }
      
      let leads = filteredLeads;
      if (sortByPosition) {
        leads = leads.sort((a, b) => {
          const posA = a.position ?? Number.MAX_SAFE_INTEGER;
          const posB = b.position ?? Number.MAX_SAFE_INTEGER;
          return posA - posB;
        });
      }
      return leads.slice(0, limit);
    }

    let leads = data || [];

    // Sort by position if requested (ascending: position 1 first)
    if (sortByPosition) {
      leads = leads.sort((a, b) => {
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
    }

    return leads;
  };

  const fetchHistoryLeads = async () => {
    const leads = await fetchLatestLeads(10, true);
    setHistoryLeads(leads);
  };

  const startPolling = (initialTimestamp: string | null) => {
    pollingRef.current = setInterval(async () => {
      const latestLead = await fetchLatestLead();

      if (latestLead) {
        const isNewLead = !initialTimestamp || new Date(latestLead.created_at) > new Date(initialTimestamp);

        if (isNewLead) {
          const latest = await fetchLatestLeads(10, true);
          setLatestLeads(latest);
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

  // Fetch initial leads when component mounts or user changes
  useEffect(() => {
    (async () => {
      const latest = await fetchLatestLeads(10, true);
      setLatestLeads(latest);
    })();
  }, [user]);

  // Refetch history when user changes (if history is open)
  useEffect(() => {
    if (showHistory) {
      fetchHistoryLeads();
    }
  }, [user, showHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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

      const webhookPayload: any = {
        "Who are you looking for?": searchQuery,
        "Location:": location,
      };

      // Add user information if logged in
      if (user?.id) {
        webhookPayload.userId = user.id;
      }
      if (user?.email) {
        webhookPayload.userEmail = user.email;
      }

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
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

  const handleDownloadExcel = async () => {
    try {
      // Fetch 10 latest leads sorted by position
      const leadsForDownload = await fetchLatestLeads(10, true);

      if (!leadsForDownload.length) {
        toast({
          title: "No leads found",
          description: "There are no leads to download.",
          variant: "destructive",
        });
        return;
      }

      const allKeys = Array.from(
        new Set(
          leadsForDownload.flatMap((lead) =>
            Object.keys(lead).filter((key) => !EXCLUDED_FIELDS.includes(key)),
          ),
        ),
      );

      const header = ["ID", "Position", "Created At", ...allKeys.map((key) => formatFieldName(key))];

      const escapeCsv = (value: unknown) => {
        const str = String(value ?? "");
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = leadsForDownload.map((lead) => {
        const base = [lead.id, lead.position ?? "", new Date(lead.created_at).toISOString()];
        const values = allKeys.map((key) => lead[key] ?? "");
        return [...base, ...values];
      });

      const csv =
        header.map(escapeCsv).join(",") +
        "\n" +
        rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instagram-latest-10-leads-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded!",
        description: "Latest 10 leads downloaded as Excel file (sorted by position).",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download leads. Please try again.",
        variant: "destructive",
      });
    }
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto">
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
        <motion.div variants={itemVariants} className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6 max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Search for Leads</h2>
            <p className="text-sm text-muted-foreground">Enter your search criteria to find Instagram leads</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="searchQuery" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
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

            <div className="space-y-3">
              <label htmlFor="location" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
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
                className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
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
              className="mt-6 p-6 bg-primary/5 rounded-lg border border-primary/20"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                />
                <p className="text-foreground font-medium">Please wait… your leads are getting generated.</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Latest 10 Leads Card - Separate Card */}
        {latestLeads.length > 0 && !isLoading && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Latest 10 Leads</h2>
                  <p className="text-sm text-muted-foreground">Recently generated leads sorted by position</p>
                </div>
              </div>
              <Button size="sm" variant="default" onClick={handleDownloadExcel} className="shrink-0">
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </Button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {latestLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-background rounded-lg border border-border/60 p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                    {lead.position && (
                      <span className="text-sm font-bold bg-primary text-primary-foreground px-3 py-1 rounded-md">
                        Position: {lead.position}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getDisplayableFields(lead)
                      .slice(0, 8)
                      .map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {formatFieldName(key)}
                          </span>
                          <span className="text-sm font-medium text-foreground break-words">
                            {formatFieldValue(key, value)}
                          </span>
                        </div>
                      ))}
                  </div>
                  {getDisplayableFields(lead).length > 8 && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                      +{getDisplayableFields(lead).length - 8} more fields
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* History Section */}
        <motion.div variants={itemVariants} className="mb-6 max-w-3xl mx-auto">
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
                  historyLeads.map((lead, index) => {
                    // Calculate sequential number based on user's history
                    // History is ordered by created_at descending (newest first)
                    // So we reverse the index to get sequential numbering (oldest = 1, newest = highest)
                    const totalCount = historyLeads.length;
                    const sequentialNumber = totalCount - index;
                    
                    return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">{sequentialNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleString()}
                        </span>
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
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
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

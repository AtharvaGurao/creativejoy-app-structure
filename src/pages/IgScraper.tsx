import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, AlertCircle, Database, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { externalSupabase } from "@/lib/externalSupabase";

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/form/58528f6c-05f7-451e-9cda-12da6f61d622";
const POLL_INTERVAL = 3000;

interface InstagramLead {
  id: number;
  created_at: string;
  username?: string;
  full_name?: string;
  bio?: string;
  followers?: number;
  following?: number;
  posts?: number;
  email?: string;
  phone?: string;
  website?: string;
  category?: string;
  location?: string;
  [key: string]: any;
}

const IgScraper = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [leadResult, setLeadResult] = useState<InstagramLead | null>(null);
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
      // Get the latest lead timestamp before submission
      const existingLead = await fetchLatestLead();
      const initialTimestamp = existingLead?.created_at || null;

      // Submit form data to n8n webhook
      const formData = new FormData();
      formData.append("search_query", searchQuery);
      formData.append("location", location);

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      // Start polling for new data
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

          {/* Result Display */}
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
              
              <div className="space-y-3">
                {leadResult.username && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Username</span>
                    <span className="text-sm font-medium text-foreground">@{leadResult.username}</span>
                  </div>
                )}
                {leadResult.full_name && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Full Name</span>
                    <span className="text-sm font-medium text-foreground">{leadResult.full_name}</span>
                  </div>
                )}
                {leadResult.email && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium text-foreground">{leadResult.email}</span>
                  </div>
                )}
                {leadResult.phone && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="text-sm font-medium text-foreground">{leadResult.phone}</span>
                  </div>
                )}
                {leadResult.bio && (
                  <div className="flex flex-col gap-1 py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Bio</span>
                    <span className="text-sm text-foreground">{leadResult.bio}</span>
                  </div>
                )}
                {leadResult.followers !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="text-sm font-medium text-foreground">{leadResult.followers?.toLocaleString()}</span>
                  </div>
                )}
                {leadResult.website && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Website</span>
                    <a href={leadResult.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {leadResult.website}
                    </a>
                  </div>
                )}
                {leadResult.category && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="text-sm font-medium text-foreground">{leadResult.category}</span>
                  </div>
                )}
                {leadResult.location && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm font-medium text-foreground">{leadResult.location}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 text-xs text-muted-foreground">
                  <span>Generated at</span>
                  <span>{new Date(leadResult.created_at).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )}
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

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Clock, ExternalLink, Heart, MessageCircle, User, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { externalSupabase } from '@/lib/externalSupabase';

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/form/b054ccd7-593f-4aa3-9aaa-45f26d817bfc";
const COUNTDOWN_SECONDS = 50;
const RETRY_INTERVAL_MS = 5000;

interface SocialPost {
  id: string;
  date: string;
  creator: string;
  post_url: string;
  original_post_text: string;
  rewritten_post_text: string;
  likes: number;
  comments: number;
  created_at: string;
}

type Status = 'idle' | 'submitting' | 'countdown' | 'fetching' | 'success' | 'error';

const LinkedIn = () => {
  const [linkedinUrl1, setLinkedinUrl1] = useState('');
  const [linkedinUrl2, setLinkedinUrl2] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [result, setResult] = useState<SocialPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submissionTimeRef = useRef<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Countdown timer effect
  useEffect(() => {
    if (status !== 'countdown') return;

    if (countdown <= 0) {
      setStatus('fetching');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown]);

  // Fetch results after countdown
  useEffect(() => {
    if (status !== 'fetching') return;

    const fetchLatestPost = async () => {
      try {
        const { data, error: fetchError } = await externalSupabase
          .from('social_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          console.log('Fetch error or no data yet, retrying...', fetchError);
          // Retry after interval
          setTimeout(fetchLatestPost, RETRY_INTERVAL_MS);
          return;
        }

        // Check if this is a new post (created after submission)
        if (data && submissionTimeRef.current) {
          const postCreatedAt = new Date(data.created_at).getTime();
          const submissionTime = new Date(submissionTimeRef.current).getTime();

          if (postCreatedAt >= submissionTime - 5000) {
            // Post is new (within 5 seconds tolerance)
            setResult(data);
            setStatus('success');
            return;
          }
        }

        // No new post yet, retry
        console.log('No new post yet, retrying in 5 seconds...');
        setTimeout(fetchLatestPost, RETRY_INTERVAL_MS);
      } catch (err) {
        console.error('Error fetching post:', err);
        setTimeout(fetchLatestPost, RETRY_INTERVAL_MS);
      }
    };

    fetchLatestPost();
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    setResult(null);

    try {
      // Record submission time
      submissionTimeRef.current = new Date().toISOString();

      // Create form data
      const formData = new FormData();
      formData.append('linkedinUrl1', linkedinUrl1);
      formData.append('linkedinUrl2', linkedinUrl2);

      // Send to n8n webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }

      // Start countdown
      setCountdown(COUNTDOWN_SECONDS);
      setStatus('countdown');
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setLinkedinUrl1('');
    setLinkedinUrl2('');
    setResult(null);
    setError(null);
    setCountdown(COUNTDOWN_SECONDS);
    submissionTimeRef.current = null;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Show result card
  if (status === 'success' && result) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Content Generated!</h1>
            <p className="text-muted-foreground text-sm">
              Here's your rewritten LinkedIn post
            </p>
          </div>

          <Card className="border border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{result.creator || 'Unknown Creator'}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(result.date || result.created_at)}</span>
                    </div>
                  </div>
                </div>
                {result.post_url && (
                  <a
                    href={result.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Original
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{result.likes || 0} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{result.comments || 0} comments</span>
                </div>
              </div>

              {/* Original Post */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Original Post
                </h3>
                <div className="rounded-xl bg-muted/50 p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {result.original_post_text || 'No original text available'}
                  </p>
                </div>
              </div>

              {/* Rewritten Post */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-primary uppercase tracking-wide">
                  Rewritten Post (Your Version)
                </h3>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {result.rewritten_post_text || 'No rewritten text available'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleReset}
                className="w-full h-12 rounded-xl"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Another
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show loading/countdown state
  if (status === 'submitting' || status === 'countdown' || status === 'fetching') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {status === 'submitting' && 'Submitting...'}
              {status === 'countdown' && 'Your data is being generated...'}
              {status === 'fetching' && 'Fetching results...'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {status === 'countdown' && `This will take about ${countdown} seconds`}
              {status === 'fetching' && 'Still generating, please wait...'}
            </p>
          </div>

          {status === 'countdown' && (
            <div className="relative pt-4">
              <div className="text-5xl font-bold text-primary">{countdown}</div>
              <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
            </div>
          )}

          {status === 'fetching' && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking for results...</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Show form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-6 rounded-2xl bg-card p-8 shadow-lg border border-border/50"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-card-foreground">LinkedIn Accounts</h1>
          <p className="text-muted-foreground text-sm">
            Please add two LinkedIn accounts of your favourite creator to then be able to scrape their posts
          </p>
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* LinkedIn URL 1 */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              LinkedIn Account Number 1 (URL) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                value={linkedinUrl1}
                onChange={(e) => setLinkedinUrl1(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
                required
              />
            </div>
          </motion.div>

          {/* LinkedIn URL 2 */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              LinkedIn Account Number 2 (URL) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                value={linkedinUrl2}
                onChange={(e) => setLinkedinUrl2(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
                required
              />
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-md"
              asChild
            >
              <motion.button whileTap={{ scale: 0.98 }}>
                Submit
              </motion.button>
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default LinkedIn;

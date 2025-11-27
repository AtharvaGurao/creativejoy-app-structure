import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { runTinyUrl } from '@/api/runTinyUrl';

const TinyUrl = () => {
  const [url, setUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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
    setError('');
    setShortenedUrl('');

    if (!webhookUrl.trim()) {
      setError('Please enter your n8n webhook URL');
      return;
    }

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setIsLoading(true);

    try {
      const result = await runTinyUrl({ url, webhookUrl });
      
      if (result.success && result.data?.shortenedUrl) {
        setShortenedUrl(result.data.shortenedUrl);
        toast({
          title: 'Success!',
          description: 'Your URL has been shortened.',
        });
      } else {
        throw new Error(result.error || 'Failed to shorten URL');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
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
        title: 'Copied!',
        description: 'Shortened URL copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL manually.',
        variant: 'destructive',
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            URL Shortener
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your long URLs into short, shareable links
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={itemVariants}
          className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="webhookUrl" className="text-sm font-medium text-foreground">
                n8n Webhook URL
              </label>
              <div className="relative">
                <Input
                  id="webhookUrl"
                  type="text"
                  placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="h-12 pr-4 text-base"
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Copy the webhook URL from your n8n 'Tiny URL Shortner' workflow
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-foreground">
                Enter your long URL
              </label>
              <div className="relative">
                <Input
                  id="url"
                  type="text"
                  placeholder="https://example.com/very/long/url/that/needs/shortening"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 pr-4 text-base"
                  disabled={isLoading}
                  required
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
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 bg-muted/50 rounded-lg border border-border"
            >
              <p className="text-muted-foreground text-center">
                Your link is being processed...
              </p>
            </motion.div>
          )}

          {/* Result Display */}
          {shortenedUrl && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-6 bg-primary/5 rounded-lg border-2 border-primary/20"
            >
              <p className="text-sm font-medium text-foreground mb-3">
                Your shortened URL:
              </p>
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
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-12 w-12 shrink-0"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Info Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-sm text-muted-foreground">
              Instant URL shortening powered by automation
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Easy Sharing</h3>
            <p className="text-sm text-muted-foreground">
              Copy and share your shortened links anywhere
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
            <h3 className="font-semibold mb-2">Clean Links</h3>
            <p className="text-sm text-muted-foreground">
              Professional, shortened URLs for better engagement
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TinyUrl;

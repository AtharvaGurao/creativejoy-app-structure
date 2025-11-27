import { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { runLinkedinParasite } from '@/api/runLinkedinParasite';

const LinkedIn = () => {
  const [linkedinUrl1, setLinkedinUrl1] = useState('');
  const [linkedinUrl2, setLinkedinUrl2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkedinUrl1.trim() || !linkedinUrl2.trim()) {
      toast({
        title: "Missing URLs",
        description: "Please enter both LinkedIn account URLs.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);

    try {
      const result = await runLinkedinParasite({
        linkedinUrl1: linkedinUrl1.trim(),
        linkedinUrl2: linkedinUrl2.trim(),
      });

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Success!",
          description: "Your LinkedIn accounts have been submitted for processing.",
        });
        setLinkedinUrl1('');
        setLinkedinUrl2('');
      } else {
        throw new Error(result.error || 'Failed to submit');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              disabled={isLoading}
              className="h-12 w-full rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-md"
              asChild
            >
              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Submitted!
                  </>
                ) : (
                  'Submit'
                )}
              </motion.button>
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default LinkedIn;

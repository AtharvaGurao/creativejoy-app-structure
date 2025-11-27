import { motion } from 'framer-motion';
import { Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WEBHOOK_URL = "https://n8n.srv1116237.hstgr.cloud/form/b054ccd7-593f-4aa3-9aaa-45f26d817bfc";

const LinkedIn = () => {
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

        <form 
          action={WEBHOOK_URL}
          method="POST"
          encType="multipart/form-data"
          className="space-y-6"
        >
          {/* LinkedIn URL 1 */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              LinkedIn Account Number 1 (URL) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                name="linkedinUrl1"
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
                name="linkedinUrl2"
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

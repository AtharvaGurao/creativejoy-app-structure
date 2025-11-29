import { motion } from "framer-motion";
import {
  Video,
  FileText,
  Youtube,
  Instagram,
  Link as LinkIcon,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const Dashboard = () => {
  const tools = [
    {
      icon: Video,
      title: "YouTube Shorts Maker",
      description:
        "Create engaging YouTube Shorts automatically with AI-powered video generation.",
      link: "/shorts",
    },
    {
      icon: FileText,
      title: "Viral Script Maker",
      description:
        "Generate viral-worthy scripts for your content with proven templates and AI.",
      link: "/scripts",
    },
    {
      icon: Youtube,
      title: "YouTube to Post",
      description: "Convert YouTube videos into social media posts instantly.",
      link: "/youtube-post",
    },
    {
      icon: Instagram,
      title: "Instagram Lead Scraper",
      description: "Extract valuable leads from Instagram profiles efficiently.",
      link: "/ig-scraper",
    },
    {
      icon: LinkIcon,
      title: "URL Shortener",
      description: "Create clean, shareable short links for all your content.",
      link: "/tinyurl",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="w-full relative pb-16 md:pb-24 overflow-visible pt-16 -mt-16">
        {/* Background - Extends upward to cover navbar seamlessly */}
        <div className="absolute -top-16 left-0 right-0 bottom-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
        <div className="absolute -top-16 left-0 right-0 bottom-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="container mx-auto px-4 relative z-10 pt-20 md:pt-28">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center pb-16"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent"
            >
              Your Creative Dashboard
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8"
            >
              Choose a tool to automate your workflow and boost productivity. 
              All your automation tools in one place.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="w-full py-12 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            {/* First 3 tools in a 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {tools.slice(0, 3).map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={tool.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3"
                  >
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={2}
                    />
                    <Link
                      to={tool.link}
                      className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm transition-all hover:shadow-lg cursor-pointer group"
                    >
                      <div className="relative flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-lg border-[0.75px] border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold tracking-tight">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Try Now</span>
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Last 2 tools centered horizontally */}
            <div className="flex flex-col md:flex-row justify-center gap-6">
              {tools.slice(3).map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={tool.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index + 3) * 0.1 }}
                    className="relative h-full w-full max-w-sm rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3"
                  >
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={2}
                    />
                    <Link
                      to={tool.link}
                      className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm transition-all hover:shadow-lg cursor-pointer group"
                    >
                      <div className="relative flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-lg border-[0.75px] border-border bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold tracking-tight">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Try Now</span>
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Zap, value: "5", label: "Powerful Tools" },
                { icon: Sparkles, value: "10K+", label: "Active Users" },
                { icon: Video, value: "50K+", label: "Tasks Completed" },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-card rounded-xl p-6 border border-border text-center hover:border-primary/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

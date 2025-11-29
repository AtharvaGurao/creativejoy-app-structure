import { AnimatedHero } from "@/components/ui/animated-hero";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Video, 
  FileText, 
  Youtube, 
  Instagram, 
  Link as LinkIcon,
  ArrowRight,
  Sparkles
} from "lucide-react";

const tools = [
  {
    title: "YouTube Shorts Maker",
    description: "Create engaging YouTube Shorts automatically with AI-powered video generation.",
    icon: Video,
    link: "/shorts",
  },
  {
    title: "Viral Script Maker",
    description: "Generate viral-worthy scripts for your content with proven templates and AI.",
    icon: FileText,
    link: "/scripts",
  },
  {
    title: "YouTube to Post",
    description: "Convert YouTube videos into social media posts instantly.",
    icon: Youtube,
    link: "/youtube-post",
  },
  {
    title: "Instagram Lead Scraper",
    description: "Extract valuable leads from Instagram profiles efficiently.",
    icon: Instagram,
    link: "/ig-scraper",
  },
  {
    title: "URL Shortener",
    description: "Create clean, shareable short links for all your content.",
    icon: LinkIcon,
    link: "/tinyurl",
  },
];

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <AnimatedHero />

      {/* Features Section */}
      <section className="w-full py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Five Powerful Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate your content creation and grow your business
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* First 3 tools in a 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {tools.slice(0, 3).map((tool) => {
                const Icon = tool.icon;
                return (
                  <div 
                    key={tool.title} 
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
                    <Link to={tool.link} className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm transition-all hover:shadow-lg cursor-pointer">
                      <div className="relative flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-lg border-[0.75px] border-border bg-muted flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold tracking-tight">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
            
            {/* Last 2 tools centered horizontally */}
            <div className="flex flex-col md:flex-row justify-center gap-6">
              {tools.slice(3).map((tool) => {
                const Icon = tool.icon;
                return (
                  <div 
                    key={tool.title} 
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
                    <Link to={tool.link} className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm transition-all hover:shadow-lg cursor-pointer">
                      <div className="relative flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-lg border-[0.75px] border-border bg-muted flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold tracking-tight">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full relative py-16 md:py-20 lg:py-24 overflow-hidden">
        {/* Enhanced Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.08),transparent_70%)]" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="space-y-6 md:space-y-8 mb-10 md:mb-12">
              {/* Icon Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 mb-4"
              >
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent"
              >
                Ready to boost your productivity?
              </motion.h2>

              {/* Sub-headline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                Join thousands of creators and businesses automating their workflow with{" "}
                <span className="font-semibold text-foreground">CreativeJoy</span>
              </motion.p>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap justify-center gap-6 md:gap-8 pt-4"
              >
                {[
                  { value: "10K+", label: "Active Users" },
                  { value: "50K+", label: "Tasks Automated" },
                  { value: "99%", label: "Satisfaction Rate" },
                ].map((stat, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-bold text-foreground">
                      {stat.value}
                    </span>
                    <span className="text-sm text-muted-foreground mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto px-8 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <span>Start Using Tools</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;

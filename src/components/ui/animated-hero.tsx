import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Sparkles, Zap, Rocket, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["powerful", "fast", "simple", "automated", "creative"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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
    <div className="w-full relative overflow-visible pt-16 -mt-16">
      {/* Animated Background Gradient - Extends upward to cover navbar seamlessly */}
      <div className="absolute -top-16 left-0 right-0 bottom-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
      <div className="absolute -top-16 left-0 right-0 bottom-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      
      {/* Floating Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-8 pt-8 pb-20 lg:pt-12 lg:pb-32 xl:pt-16 xl:pb-40 items-center justify-center flex-col"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <Link to="/dashboard">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 group hover:scale-105 transition-transform duration-200 shadow-sm border border-border/50"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Explore our automation tools</span>
                <MoveRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Main Heading */}
          <motion.div variants={itemVariants} className="flex gap-4 flex-col items-center">
            <h1 className="text-5xl md:text-7xl lg:text-8xl max-w-4xl tracking-tight text-center font-bold leading-[1.1]">
              <span className="text-foreground block mb-2">Automation that's</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 min-h-[1.2em]">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                            scale: 0.8,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl lg:text-2xl leading-relaxed tracking-tight text-muted-foreground max-w-3xl text-center mt-4"
            >
              CreativeJoy brings you powerful automation tools for content creation, 
              lead generation, and productivity. From viral scripts to voice agents, 
              streamline your workflow with our suite of AI-powered tools.
            </motion.p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mt-4"
          >
            <Button
              size="lg"
              className="gap-2 group px-8 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              asChild
            >
              <Link to="/dashboard">
                <Rocket className="w-5 h-5" />
                <span>Get Started</span>
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats or Features */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl"
          >
            {[
              { icon: Zap, label: "Lightning Fast", value: "Instant Results" },
              { icon: Brain, label: "AI-Powered", value: "Smart Automation" },
              { icon: Rocket, label: "Scale Easily", value: "Grow Your Business" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export { AnimatedHero };

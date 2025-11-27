import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(() => ["powerful", "fast", "simple", "automated", "creative"], []);
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
  return <div className="w-full">
      <div className="container mx-auto">
        <div className="gap-8 py-20 lg:py-40 items-center justify-center flex flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Explore our automation tools <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-foreground">Automation that's</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => <motion.span key={index} className="absolute font-semibold" initial={{
                opacity: 0,
                y: "-100"
              }} transition={{
                type: "spring",
                stiffness: 50
              }} animate={titleNumber === index ? {
                y: 0,
                opacity: 1
              } : {
                y: titleNumber > index ? -150 : 150,
                opacity: 0
              }}>
                    {title}
                  </motion.span>)}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              CreativeJoy brings you powerful automation tools for content creation, 
              lead generation, and productivity. From viral scripts to voice agents, 
              streamline your workflow with our suite of AI-powered tools.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline" asChild>
              <Link to="/pricing">
                View Pricing <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" className="gap-4" asChild>
              <Link to="/dashboard">
                Get Started <Sparkles className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>;
}
export { AnimatedHero };
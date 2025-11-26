import { AnimatedHero } from "@/components/ui/animated-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Video, 
  FileText, 
  Youtube, 
  Instagram, 
  Linkedin, 
  Link as LinkIcon, 
  Phone 
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
    title: "LinkedIn Content Parasite",
    description: "Repurpose trending LinkedIn content for your brand.",
    icon: Linkedin,
    link: "/linkedin",
  },
  {
    title: "TinyURL Shortener",
    description: "Create clean, shareable short links for all your content.",
    icon: LinkIcon,
    link: "/tinyurl",
  },
  {
    title: "Voice + Calendar Agent",
    description: "AI voice assistant that manages your calendar and appointments.",
    icon: Phone,
    link: "/voice",
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
              Seven Powerful Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate your content creation and grow your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to={tool.link}>
                        Try Now
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of creators and businesses automating their workflow with CreativeJoy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Start Using Tools
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">
                  View Pricing Plans
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

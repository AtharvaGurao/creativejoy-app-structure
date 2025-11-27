import {
  AuroraBackground,
  BentoGrid,
  BentoGridItem,
} from '@/components/ui/aurora-bento-grid';
import {
  Video,
  FileText,
  Youtube,
  Instagram,
  Linkedin,
  Link as LinkIcon,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const tools = [
    {
      icon: <Video className="w-10 h-10 text-white" />,
      title: 'YouTube Shorts Maker',
      description:
        'Create engaging YouTube Shorts automatically with AI-powered video generation.',
      link: '/shorts',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-cyan-400',
    },
    {
      icon: <FileText className="w-10 h-10 text-white" />,
      title: 'Viral Script Maker',
      description:
        'Generate viral-worthy scripts for your content with proven templates and AI.',
      link: '/scripts',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-400',
    },
    {
      icon: <Youtube className="w-10 h-10 text-white" />,
      title: 'YouTube to Post',
      description:
        'Convert YouTube videos into social media posts instantly.',
      link: '/youtube-post',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-violet-400',
    },
    {
      icon: <Instagram className="w-10 h-10 text-white" />,
      title: 'Instagram Lead Scraper',
      description:
        'Extract valuable leads from Instagram profiles efficiently.',
      link: '/ig-scraper',
      gradientFrom: 'from-yellow-500',
      gradientTo: 'to-amber-400',
    },
    {
      icon: <Linkedin className="w-10 h-10 text-white" />,
      title: 'LinkedIn Content Parasite',
      description:
        'Repurpose trending LinkedIn content for your brand.',
      link: '/linkedin',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-orange-400',
    },
    {
      icon: <LinkIcon className="w-10 h-10 text-white" />,
      title: 'TinyURL Shortener',
      description:
        'Create clean, shareable short links for all your content.',
      link: '/tinyurl',
      gradientFrom: 'from-pink-500',
      gradientTo: 'to-rose-400',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background font-sans antialiased relative">
      <AuroraBackground />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1
            className="
              text-4xl md:text-6xl font-extrabold tracking-tight
              bg-gradient-to-r from-primary via-purple-400 to-blue-500
              bg-clip-text text-transparent
            "
          >
            Your Creative Dashboard
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose a tool to automate your workflow and boost productivity
          </p>
        </div>

        <BentoGrid>
          {tools.map((tool, i) => (
            <BentoGridItem
              key={i}
              gradientFrom={tool.gradientFrom}
              gradientTo={tool.gradientTo}
            >
              <div className="mb-4">{tool.icon}</div>
              <div className="flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-2">
                  {tool.title}
                </h3>
                <p className="text-gray-200 text-sm flex-grow">
                  {tool.description}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  to={tool.link}
                  className="
                    text-white font-semibold text-sm inline-flex items-center
                    group
                  "
                >
                  Try Now
                  <ArrowRight className="ml-1 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </div>
    </div>
  );
};

export default Dashboard;

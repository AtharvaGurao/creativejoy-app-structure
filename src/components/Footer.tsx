import { Footer7 } from "./ui/footer-7";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  const sections = [
    {
      title: "Tools",
      links: [
        { name: "YouTube Shorts", href: "/shorts" },
        { name: "Viral Scripts", href: "/scripts" },
        { name: "YouTube to Post", href: "/youtube-post" },
        { name: "Instagram Scraper", href: "/ig-scraper" },
        { name: "LinkedIn Parasite", href: "/linkedin" },
        { name: "TinyURL Shortener", href: "/tinyurl" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Pricing", href: "/pricing" },
        { name: "Dashboard", href: "/dashboard" },
        { name: "History", href: "/history" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Contact", href: "#" },
        { name: "Blog", href: "#" },
        { name: "API Docs", href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { icon: <Instagram className="size-5" />, href: "#", label: "Instagram" },
    { icon: <Facebook className="size-5" />, href: "#", label: "Facebook" },
    { icon: <Twitter className="size-5" />, href: "#", label: "Twitter" },
    { icon: <Linkedin className="size-5" />, href: "#", label: "LinkedIn" },
  ];

  const legalLinks = [
    { name: "Terms and Conditions", href: "#" },
    { name: "Privacy Policy", href: "#" },
  ];

  return (
    <Footer7
      logo={{
        url: "/",
        src: "/logo.png",
        alt: "CreativeJoy logo",
        title: "CreativeJoy",
      }}
      sections={sections}
      description="Automate your content creation with powerful AI tools. Create YouTube shorts, viral scripts, and more in minutes."
      socialLinks={socialLinks}
      copyright={`© ${new Date().getFullYear()} CreativeJoy. All rights reserved.`}
      legalLinks={legalLinks}
    />
  );
};

export default Footer;

import type { Project } from './types';
import { useTexture } from '@react-three/drei';

// The site's nav links expressed as film-strip projects.
export const NAV_PROJECTS: Project[] = [
  { 
    id: 'home', 
    title: 'Home', 
    category: 'Festival Hub', 
    description: 'The Sabrang 2026 landing experience.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060182/sabrang-2026/about/fest-crowd-lights.jpg", 
    href: '/' 
  },
  { 
    id: 'about', 
    title: 'About', 
    category: 'Our Story', 
    description: 'What Sabrang is and why it exists.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060356/sabrang-2026/menu-scroll-covers/echos-of-noor.png", 
    href: '/about' 
  },
  { 
    id: 'events', 
    title: 'Events', 
    category: 'Compete', 
    description: 'Every competition and showcase.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060355/sabrang-2026/menu-scroll-covers/dance-battle.png", 
    href: '/events' 
  },
  { 
    id: 'gallery', 
    title: 'Gallery', 
    category: 'Memories', 
    description: 'Highlights from past editions.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060269/sabrang-2026/gallery/43.webp", 
    href: '/gallery' 
  },
  { 
    id: 'schedule', 
    title: 'Schedule', 
    category: 'Timeline', 
    description: 'When everything happens.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060358/sabrang-2026/menu-scroll-covers/panache-runway.png", 
    href: '/schedule' 
  },
  { 
    id: 'register', 
    title: 'Registration', 
    category: 'Join Us', 
    description: 'Sign up to participate.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060360/sabrang-2026/menu-scroll-covers/step-up.jpg", 
    href: '/register' 
  },
  { 
    id: 'sponsors', 
    title: 'Sponsors', 
    category: 'Partners', 
    description: 'The brands powering Sabrang.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060362/sabrang-2026/past-sponsors/JK-Tyre.png", 
    href: '/sponsors' 
  },
  { 
    id: 'team', 
    title: 'Our Team', 
    category: 'The Crew', 
    description: 'The people behind the festival.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084250/sabrang-2026/team/kartik-sharma.jpg", 
    href: '/team' 
  },
  { 
    id: 'contact', 
    title: 'Contact Us', 
    category: 'Say Hello', 
    description: 'Reach the organising team.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060359/sabrang-2026/menu-scroll-covers/sabrang-live.png", 
    href: '/contact' 
  },
  { 
    id: 'faq', 
    title: 'FAQ', 
    category: 'Answers', 
    description: 'Everything commonly asked.', 
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060360/sabrang-2026/menu-scroll-covers/versevaad.jpg", 
    href: '/faq' 
  },
];

// Preload all reel textures into GPU cache ahead of time
if (typeof window !== 'undefined') {
  NAV_PROJECTS.forEach((p) => {
    if (p.image) {
      try {
        useTexture.preload(p.image);
      } catch {}
    }
  });
}

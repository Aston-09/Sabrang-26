import type { Project } from './types';
import { preloadAllTextures } from './FilmFrame';
import { createFilmTextures, createShadowTexture } from './FilmMaterial';

// The site's nav links expressed as film-strip projects.
export const NAV_PROJECTS: Project[] = [
  { 
    id: 'home', 
    title: 'Home', 
    category: 'Festival Hub', 
    description: 'The Sabrang 2026 landing experience.', 
    image: "/menu-scroll-covers/home.png",
    href: '/'
  },
  { 
    id: 'about', 
    title: 'About', 
    category: 'Our Story', 
    description: 'What Sabrang is and why it exists.', 
    image: "/menu-scroll-covers/about.png", 
    href: '/about' 
  },
  { 
    id: 'events', 
    title: 'Events', 
    category: 'Compete', 
    description: 'Every competition and showcase.', 
    image: "/menu-scroll-covers/events.png",
    href: '/events'
  },
  { 
    id: 'gallery', 
    title: 'Gallery', 
    category: 'Memories', 
    description: 'Highlights from past editions.', 
    image: "/menu-scroll-covers/gallery.png",
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
    title: 'Team', 
    category: 'The Crew', 
    description: 'The people behind the festival.', 
    image: "/menu-scroll-covers/team.png", 
    href: '/team' 
  },
  { 
    id: 'contact', 
    title: 'Contact Us', 
    category: 'Say Hello', 
    description: 'Reach the organising team.', 
    image: "/menu-scroll-covers/contactus.png", 
    href: '/contact' 
  },
  { 
    id: 'faq', 
    title: 'FAQ', 
    category: 'Answers', 
    description: 'Everything commonly asked.', 
    image: "/menu-scroll-covers/faq.png", 
    href: '/faq' 
  },
];

// Preload all reel textures and warm up canvas textures during idle time
if (typeof window !== 'undefined') {
  const warmup = () => {
    try {
      preloadAllTextures(NAV_PROJECTS.map((p) => p.image).filter(Boolean));
      createFilmTextures();
      createShadowTexture();
    } catch {}
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(warmup, { timeout: 2000 });
  } else {
    setTimeout(warmup, 300);
  }
}

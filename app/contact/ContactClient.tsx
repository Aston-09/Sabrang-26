"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ContactForm from "@/components/forms/ContactForm";
import FaqParticleBackground from "@/components/ui/FaqParticleBackground";
import { ORGANIZING_HEADS, SITE_CONFIG } from "@/lib/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const revealElements = gsap.utils.toArray<HTMLElement>('.gsap-reveal');

      revealElements.forEach((el) => {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 40,
            scale: 0.98,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 95%",
              end: "top 70%",
              scrub: 1,
            },
          }
        );
      });

      const headCards = gsap.utils.toArray<HTMLElement>('.gsap-stagger-card');
      if (headCards.length > 0) {
        gsap.fromTo(
          headCards,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".gsap-stagger-container",
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 md:px-8 pb-24 overflow-x-hidden bg-transparent" ref={containerRef}>
      <FaqParticleBackground />

      <div className="relative z-10 max-w-6xl mx-auto space-y-12 md:space-y-16">
        <motion.section 
          className="text-center space-y-4 pt-8 md:pt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white tracking-tight uppercase drop-shadow-lg">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-white/70 max-w-2xl mx-auto font-medium px-4">
            Have questions or want to collaborate? Connect with the organizing team of {SITE_CONFIG.name}.
          </p>
        </motion.section>

        <section className="space-y-8 md:space-y-12 gsap-stagger-container">
          <div className="text-center space-y-2 gsap-reveal">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Organizing Heads
            </h2>
          </div>
          <StaticOrganizingHeads />
        </section>

        <section className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden gsap-reveal mx-2 sm:mx-0">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-3xl">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 mx-auto">
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-white/90">
              Drop Us An Email At
            </h2>
            <div className="break-words">
              <a href={`mailto:${SITE_CONFIG.email}`} className="text-xl sm:text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:opacity-80 transition-opacity">
                {SITE_CONFIG.email}
              </a>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-10 space-y-8 shadow-xl gsap-reveal mx-2 sm:mx-0">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Send Us A Message
            </h2>
            <ContactForm />
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-10 space-y-8 shadow-xl gsap-reveal mx-2 sm:mx-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none rounded-3xl">
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px]" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
                Festival Venue
              </h2>

              <div className="space-y-6 text-white/70 text-sm md:text-base leading-relaxed">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base md:text-lg mb-1">
                      {SITE_CONFIG.university.name}
                    </h3>
                    <p>Mahapura, Ajmer Road</p>
                    <p>Jaipur, Rajasthan 302026</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/10">
                <a
                  href="https://maps.google.com/?q=JK+Lakshmipat+University+Jaipur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-neutral-200 text-neutral-900 rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg hover:shadow-xl"
                >
                  <span>View On Google Maps</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const StaticOrganizingHeads = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
      {ORGANIZING_HEADS.map((head, index) => (
        <div key={index} className="gsap-stagger-card group bg-neutral-900/50 backdrop-blur-xl border border-white/5 hover:border-indigo-500/30 rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-indigo-500/10">
          <div className="relative w-full aspect-[4/5] overflow-hidden">
            <Image
              src={head.image || "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060269/sabrang-2026/gallery/43.webp"}
              alt={head.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                {head.name}
              </h3>
              <p className="text-indigo-300 font-medium text-sm mb-4">
                {head.role || "Organizing Head"}
              </p>
              <a
                href={`tel:${head.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30 w-fit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1.01 1.01 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{head.displayPhone}</span>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


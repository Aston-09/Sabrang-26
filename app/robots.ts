import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://sabrang.jklu.edu.in";
  const disallow = ["/admin/", "/api/", "/dashboard/", "/login/"];

  return {
    rules: [
      // General crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Google Search
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow,
      },
      // Google AI (Gemini training / SGE)
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow,
      },
      // Bing Search
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow,
      },
      // Bing Copilot preview renderer
      {
        userAgent: "BingPreview",
        allow: "/",
        disallow,
      },
      // Microsoft Copilot AI crawler
      {
        userAgent: "adidxbot",
        allow: "/",
        disallow,
      },
      // OpenAI ChatGPT
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow,
      },
      // OpenAI ChatGPT browsing plugin
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow,
      },
      // Anthropic Claude
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow,
      },
      // Claude web browsing
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow,
      },
      // Perplexity AI
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // LLM crawler guidance — see https://llmstxt.org
    host: baseUrl,
  };
}

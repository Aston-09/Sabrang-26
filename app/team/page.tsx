import type { Metadata } from "next";
import TeamClient from "./TeamClient";
import JsonLd from "@/components/seo/JsonLd";
import { TEAM_MEMBERS, TEAM_IMAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Organizing Team | Sabrang 2026",
  description:
    "Meet the Organizing Heads and Core Committees of JK Lakshmipat University behind Sabrang 2026.",
  keywords: [
    ...TEAM_MEMBERS.map((m) => m.name),
    ...TEAM_MEMBERS.map((m) => `${m.name} JKLU`),
    ...TEAM_MEMBERS.map((m) => `${m.name} Sabrang`),
    "Organizing Team",
    "Sabrang Team",
    "Sabrang 2026 Organizers",
    "JKLU Student Committees",
    "Sabrang Leadership",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/team" },
  openGraph: {
    title: "Organizing Team | Sabrang 2026",
    description:
      "Meet the Organizing Heads and Core Committees behind Sabrang 2026 at JKLU.",
    url: "https://sabrang.jklu.edu.in/team",
    siteName: "Sabrang 2026 - JKLU",
    type: "website",
  },
};

const teamMemberPersonSchemas = TEAM_MEMBERS.filter(
  (m) => Boolean(TEAM_IMAGES[m.name])
).map((m) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: m.name,
  alternateName: [`${m.name} JKLU`, `${m.name} Sabrang`],
  jobTitle: `${m.role} - Sabrang 2026`,
  url: "https://sabrang.jklu.edu.in/team",
  image: {
    "@type": "ImageObject",
    url: TEAM_IMAGES[m.name],
    contentUrl: TEAM_IMAGES[m.name],
    caption: `${m.name} - ${m.role}, Sabrang 2026, JK Lakshmipat University`,
    name: m.name,
  },
  sameAs: m.links ? Object.values(m.links).filter(Boolean) : [],
  worksFor: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
}));

const teamSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sabrang 2026 Student Organizing Committee",
  parentOrganization: {
    "@type": "EducationalOrganization",
    name: "JK Lakshmipat University",
    url: "https://jklu.edu.in",
  },
  member: TEAM_MEMBERS.map((m) => ({
    "@type": "Person",
    name: m.name,
    jobTitle: `${m.role} - Sabrang 2026`,
    image: TEAM_IMAGES[m.name] || undefined,
    url: "https://sabrang.jklu.edu.in/team",
    worksFor: {
      "@type": "EducationalOrganization",
      name: "JK Lakshmipat University",
      url: "https://jklu.edu.in",
    },
    sameAs: m.links ? Object.values(m.links).filter(Boolean) : [],
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://sabrang.jklu.edu.in",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Team",
      item: "https://sabrang.jklu.edu.in/team",
    },
  ],
};

export default function TeamPage() {
  return (
    <>
      {teamMemberPersonSchemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
      <JsonLd data={teamSchema} />
      <JsonLd data={breadcrumbSchema} />
      <TeamClient />
    </>
  );
}

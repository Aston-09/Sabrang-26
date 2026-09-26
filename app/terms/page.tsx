import { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Terms and Conditions | Sabrang 2026 | JKLU",
  description:
    "Official Terms and Conditions for registration, ticket purchase, attendance, and code of conduct for Sabrang 2026, the annual cultural festival of JK Lakshmipat University, Jaipur.",
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/terms",
  },
  openGraph: {
    title: "Terms and Conditions | Sabrang 2026 | JKLU",
    description:
      "Official Terms and Conditions for Sabrang 2026 at JK Lakshmipat University.",
    url: "https://sabrang.jklu.edu.in/terms",
    siteName: "Sabrang 2026",
    type: "website",
  },
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms and Conditions - Sabrang 2026",
    description: "Terms and Conditions for festival registration and ticket purchasing.",
    url: "https://sabrang.jklu.edu.in/terms",
    publisher: {
      "@type": "EducationalOrganization",
      name: "JK Lakshmipat University",
      url: "https://jklu.edu.in",
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="min-h-screen bg-[#07050b] text-[#f3f0f7] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="border-b border-white/10 pb-8 space-y-3">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-purple-400">
              Legal Compliance & Merchant Agreement
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Terms & Conditions
            </h1>
            <p className="text-sm text-white/60">
              Last updated: September 2026 | Applicable to all participants, visitors, and ticket holders
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-10 text-sm sm:text-base leading-relaxed text-white/80 font-normal">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                1. Introduction and Legal Entity
              </h2>
              <p>
                Welcome to <strong>Sabrang 2026</strong>, the official annual cultural festival organized by{" "}
                <strong>JK Lakshmipat University (JKLU)</strong>, located at Near Mahindra World City, P.O.
                Mahapura, Ajmer Road, Jaipur, Rajasthan - 302026, India.
              </p>
              <p>
                By accessing this website (<Link href="/" className="text-purple-400 underline">https://sabrang.jklu.edu.in</Link>),
                registering for any event, purchasing a fest pass, or entering the university campus during the
                festival dates (October 23–25, 2026), you acknowledge that you have read, understood, and agree to be
                bound by these Terms and Conditions.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                2. Eligibility and Registration
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>
                  Registration is open to bona fide students from recognized schools, colleges, and universities across India, as well as authorized visitors.
                </li>
                <li>
                  Participants must provide authentic and verifiable personal information (full name, valid mobile number, official educational institution, and government or college-issued photo ID).
                </li>
                <li>
                  Providing false, misleading, or impersonated information will result in immediate disqualification and revocation of festival passes without refund.
                </li>
                <li>
                  Each festival pass or competition ticket is unique to the registered individual and is non-transferable under any circumstances.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                3. Payment and Payment Gateway Services
              </h2>
              <p>
                All online transactions and registrations on this platform are processed securely via our authorized
                payment aggregator, <strong>Cashfree Payments India Private Limited</strong>.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>All prices listed on the platform are in <strong>Indian National Rupees (INR / ₹)</strong> inclusive of applicable charges.</li>
                <li>Payment can be made through UPI, credit cards, debit cards, net banking, and authorized digital wallets supported by Cashfree.</li>
                <li>Upon successful authorization by the issuing bank, a unique payment transaction ID and digital confirmation receipt will be generated.</li>
                <li>The organizers are not responsible for transaction failures, bank network timeouts, or authorization delays caused by third-party payment infrastructure.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                4. Campus Entry and Event Code of Conduct
              </h2>
              <p>
                Security and safety are of paramount importance. Admission to the festival premises is strictly subject to the following rules:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>Attendees must present their original government-issued photo ID (Aadhaar, Driving License, Passport, or Voter ID) along with their official College/School ID card at the university entry gates.</li>
                <li>Every participant must present their valid digital QR entry pass generated upon registration.</li>
                <li>Possession, consumption, or distribution of alcohol, narcotics, cigarettes, e-cigarettes, weapons, inflammable objects, or any banned contraband is strictly prohibited on campus.</li>
                <li>Any attendee found engaging in disorderly conduct, harassment, vandalism, physical altercations, or non-compliance with security staff will be expelled immediately and handed over to local law enforcement authorities.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                5. Intellectual Property and Media Rights
              </h2>
              <p>
                All trademarks, logos, festival branding, graphics, website software, and creative materials associated with Sabrang 2026 are the intellectual property of JK Lakshmipat University.
              </p>
              <p>
                By attending the festival, attendees grant the organizers irrevocable permission to record, photograph, broadcast, and utilize their likeness in promotional materials, after-movies, and official social media channels without compensation.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                6. Limitation of Liability and Force Majeure
              </h2>
              <p>
                JK Lakshmipat University, its management, faculty, students, and organizing committee shall not be held liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>Loss, theft, or damage to personal belongings (laptops, phones, bags, vehicles, etc.) brought to the venue.</li>
                <li>Personal injury or medical emergencies resulting from reckless behavior or non-compliance with safety instructions.</li>
                <li>Alteration, rescheduling, or cancellation of specific performances, artist line-ups, or competition schedules due to weather conditions, technical disruptions, regulatory directives, or force majeure events.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                7. Governing Law and Jurisdiction
              </h2>
              <p>
                These Terms and Conditions shall be governed by, construed, and enforced in accordance with the laws of the Republic of India. Any legal disputes or claims arising out of or in connection with the festival shall be subject to the exclusive jurisdiction of the competent courts in <strong>Jaipur, Rajasthan, India</strong>.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3 border-t border-white/10 pt-6">
              <h2 className="text-xl font-bold text-white tracking-wide">
                8. Contact for Legal and Policy Inquiries
              </h2>
              <p>
                For questions regarding these Terms & Conditions, please contact:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 font-mono text-xs sm:text-sm text-white/80 space-y-1">
                <p className="font-bold text-white">{SITE_CONFIG.university.name}</p>
                <p>Sabrang 2026 Organizing Committee</p>
                <p>Near Mahindra World City, P.O. Mahapura, Ajmer Road</p>
                <p>Jaipur, Rajasthan - 302026, India</p>
                <p>Email: <a href="mailto:sabrang@jklu.edu.in" className="text-purple-400 underline">sabrang@jklu.edu.in</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

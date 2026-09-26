import { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Privacy Policy | Sabrang 2026 | JKLU",
  description:
    "Official Privacy Policy of Sabrang 2026, JK Lakshmipat University. Learn how we collect, protect, and process user data in compliance with regulatory standards.",
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Sabrang 2026 | JKLU",
    description:
      "Official Privacy Policy for Sabrang 2026 at JK Lakshmipat University.",
    url: "https://sabrang.jklu.edu.in/privacy",
    siteName: "Sabrang 2026",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy - Sabrang 2026",
    description: "Privacy Policy and personal data protection principles for Sabrang 2026.",
    url: "https://sabrang.jklu.edu.in/privacy",
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
              Data Protection & Privacy Standards
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Privacy Policy
            </h1>
            <p className="text-sm text-white/60">
              Effective Date: September 2026 | JK Lakshmipat University, Jaipur
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 text-sm sm:text-base leading-relaxed text-white/80 font-normal">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                1. Overview and Scope
              </h2>
              <p>
                <strong>JK Lakshmipat University</strong> (&quot;University&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the official web portal for <strong>Sabrang 2026</strong> (<Link href="/" className="text-purple-400 underline">https://sabrang.jklu.edu.in</Link>). We respect your privacy and are committed to protecting the personal information you share with us during event registration, ticket purchase, and festival interactions.
              </p>
              <p>
                This Privacy Policy outlines how your personal data is collected, stored, processed, and safeguarded in accordance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act (DPDPA), 2023.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                2. Information We Collect
              </h2>
              <p>When you register for Sabrang 2026, we may collect the following categories of information:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li><strong>Identity & Contact Information:</strong> Full legal name, email address, mobile number, emergency contact details, and parent/guardian contact numbers.</li>
                <li><strong>Academic & Institution Details:</strong> Name of your school, college, or university, degree/program, and academic registration/roll number.</li>
                <li><strong>Identity Verification Documents:</strong> Scanned copies or photographs of college/institution identity cards or government-issued photo identification for security credentialing.</li>
                <li><strong>Transaction Details:</strong> Payment order ID, transaction status, bank reference number, payment timestamp, and payment method used. <em>Note: We do not store credit/debit card numbers, CVVs, or bank net-banking passwords. All sensitive payment credentials are processed directly through certified PCI-DSS compliant payment gateways.</em></li>
                <li><strong>Technical Information:</strong> IP address, device type, browser information, and referral tracking identifiers for fraud prevention and analytics.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                3. Purpose of Data Processing
              </h2>
              <p>We process your personal information strictly for legitimate festival operations, including:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>Generating and issuing digital entry passes, competition admit cards, and payment receipts.</li>
                <li>Validating campus admission at university security checkpoints and preventing impersonation.</li>
                <li>Sending essential updates, scheduling changes, rulebook notifications, and emergency alerts.</li>
                <li>Managing prize distribution, certificate issuance, and academic attendance verification where applicable.</li>
                <li>Complying with university safety regulations, insurance protocols, and statutory law enforcement requirements.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                4. Third-Party Disclosures & Payment Partners
              </h2>
              <p>
                We value your trust. We <strong>never sell, rent, trade, or monetize</strong> your personal information to marketing agencies or third parties. Information is only shared under the following limited circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li><strong>Payment Aggregator:</strong> We share transaction data with <strong>Cashfree Payments India Private Limited</strong> for the sole purpose of securely processing customer payments, processing refunds, and preventing fraudulent transactions.</li>
                <li><strong>Communication Providers:</strong> Trusted cloud infrastructure and transactional email/SMS service providers (e.g., Google Cloud, Nodemailer, Firebase) to deliver digital entry tickets and confirmations.</li>
                <li><strong>Legal & Regulatory Authorities:</strong> If required by court orders, government authorities, or law enforcement agencies for safety and compliance.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                5. Data Security and Retention
              </h2>
              <p>
                We employ industry-standard administrative, physical, and technical safeguards (including 256-bit SSL encryption, database firewalls, role-based access control, and atomic transaction locks) to prevent unauthorized access, loss, alteration, or misuse of your personal data.
              </p>
              <p>
                Your registration records are retained for the duration necessary to conclude festival operations, audits, certification, and accounting compliance, after which they are securely archived or purged in accordance with university retention policies.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                6. Your Rights and Grievance Redressal
              </h2>
              <p>
                You have the right to access, verify, and request correction of inaccurate personal details on your registration profile before the close of event registrations. For inquiries or concerns regarding data privacy, you may contact our designated Grievance Officer:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 font-mono text-xs sm:text-sm text-white/80 space-y-1">
                <p className="font-bold text-white">Privacy & Grievance Cell</p>
                <p>JK Lakshmipat University</p>
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

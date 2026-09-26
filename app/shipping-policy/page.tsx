import { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Sabrang 2026 | JKLU",
  description:
    "Official Shipping and Digital Delivery Policy for Sabrang 2026 tickets, passes, and registrations at JK Lakshmipat University, Jaipur.",
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/shipping-policy",
  },
  openGraph: {
    title: "Shipping & Delivery Policy | Sabrang 2026 | JKLU",
    description:
      "Official Shipping and Delivery terms for digital passes at Sabrang 2026, JKLU.",
    url: "https://sabrang.jklu.edu.in/shipping-policy",
    siteName: "Sabrang 2026",
    type: "website",
  },
};

export default function ShippingPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Shipping and Delivery Policy - Sabrang 2026",
    description: "Digital ticket fulfillment and delivery policy for festival passes.",
    url: "https://sabrang.jklu.edu.in/shipping-policy",
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
              Fulfillment & Ticket Delivery Terms
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Shipping & Delivery Policy
            </h1>
            <p className="text-sm text-white/60">
              Last updated: September 2026 | Digital Service Fulfillment
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 text-sm sm:text-base leading-relaxed text-white/80 font-normal">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                1. Nature of Services and Deliverables
              </h2>
              <p>
                <strong>Sabrang 2026</strong> is the annual cultural festival of <strong>JK Lakshmipat University (JKLU)</strong>. All products and services available on this website (<Link href="/" className="text-purple-400 underline">https://sabrang.jklu.edu.in</Link>), including festival access passes, competition registrations, and event tickets, are purely <strong>intangible digital services</strong>.
              </p>
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
                <strong>No Physical Shipping:</strong> We do not sell, ship, or deliver physical goods, paper tickets, or merchandise through postal or courier services. There are <strong>no shipping fees, delivery charges, or logistics costs</strong> associated with any order.
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                2. Digital Delivery Method and Process
              </h2>
              <p>
                Upon successful payment completion and authorization through our secure payment gateway (Cashfree), delivery of your festival entry pass is executed digitally through the following channels:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>
                  <strong>Immediate On-Screen Confirmation:</strong> Immediately following transaction completion, you will be redirected to an order confirmation screen displaying your Order ID, Payment ID, and registered event details.
                </li>
                <li>
                  <strong>Electronic Ticket (E-Ticket) &amp; Receipt via Email:</strong> An automated confirmation email containing your official PDF registration receipt and a unique QR entry code is dispatched to the email address provided during registration.
                </li>
                <li>
                  <strong>SMS Notification (Optional):</strong> A confirmation SMS with registration details and transaction reference may be sent to your registered Indian mobile number.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                3. Delivery Timeline
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>
                  <strong>Instant Delivery:</strong> Under normal network operations, digital tickets and confirmation receipts are delivered within <strong>0 to 15 minutes</strong> of payment verification.
                </li>
                <li>
                  <strong>Maximum Delivery Window:</strong> In instances of high server traffic or transactional delays with banking networks, delivery may take up to <strong>24 hours</strong>.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                4. Non-Receipt of E-Ticket or Digital Passes
              </h2>
              <p>
                If you have completed your payment successfully and have not received your confirmation email within 24 hours:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-white/75">
                <li>Check your Spam, Junk, or Promotions folder in your email client.</li>
                <li>Verify that the email address provided during registration was spelled correctly.</li>
                <li>
                  If the confirmation is still missing, contact our support team at{" "}
                  <a href="mailto:sabrang@jklu.edu.in" className="text-purple-400 underline">
                    sabrang@jklu.edu.in
                  </a>{" "}
                  with your payment transaction ID or bank debit receipt for prompt resolution and manual pass reissuance.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3 border-t border-white/10 pt-6">
              <h2 className="text-xl font-bold text-white tracking-wide">
                5. Contact Information for Fulfillment Queries
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 font-mono text-xs sm:text-sm text-white/80 space-y-1">
                <p className="font-bold text-white">{SITE_CONFIG.university.name}</p>
                <p>Sabrang 2026 Ticket Fulfillment Cell</p>
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

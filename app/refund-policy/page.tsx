import { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Sabrang 2026 | JKLU",
  description:
    "Official Refund, Return, and Cancellation Policy for Sabrang 2026 tickets and passes. Clear guidelines on transaction disputes, duplicate debits, and processing timelines.",
  alternates: {
    canonical: "https://sabrang.jklu.edu.in/refund-policy",
  },
  openGraph: {
    title: "Refund & Cancellation Policy | Sabrang 2026 | JKLU",
    description:
      "Official Refund and Cancellation Policy for Sabrang 2026 at JK Lakshmipat University.",
    url: "https://sabrang.jklu.edu.in/refund-policy",
    siteName: "Sabrang 2026",
    type: "website",
  },
};

export default function RefundPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Refund and Cancellation Policy - Sabrang 2026",
    description: "Refund and Cancellation policy for festival tickets and passes.",
    url: "https://sabrang.jklu.edu.in/refund-policy",
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
              Customer Protection & Billing Transparency
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Refund & Cancellation Policy
            </h1>
            <p className="text-sm text-white/60">
              Last updated: September 2026 | Sabrang 2026, JK Lakshmipat University
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 text-sm sm:text-base leading-relaxed text-white/80 font-normal">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                1. General Ticket & Pass Cancellation Policy
              </h2>
              <p>
                <strong>Sabrang 2026</strong> is a live cultural festival organized by <strong>JK Lakshmipat University (JKLU)</strong>. Due to upfront logistical planning, artist bookings, stage production, and venue capacity limitations:
              </p>
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
                <strong>Standard Rule:</strong> All festival entry passes, competition registrations, and event tickets purchased on <Link href="/" className="underline">https://sabrang.jklu.edu.in</Link> are <strong>strictly non-refundable and non-transferable</strong> once a successful transaction has been completed.
              </div>
              <p>
                Voluntary cancellations, change of plans, or failure to attend the festival on scheduled event dates will not be eligible for a refund or credit note.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                2. Failed Transactions and Double Debits
              </h2>
              <p>
                If your payment was debited from your bank account, credit card, debit card, or UPI app, but you did not receive a confirmation receipt or order ID due to network drops, bank gateway timeouts, or session interruptions:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>
                  <strong>Automatic Reversal:</strong> Such transactions are classified as &quot;Failed Transactions&quot;. The banking system and our payment partner (Cashfree) will automatically reconcile the transaction.
                </li>
                <li>
                  <strong>Refund Processing Timeline:</strong> The debited funds will be automatically refunded back to the original source account within <strong>5 to 7 working days</strong> (excluding bank holidays and weekends).
                </li>
                <li>
                  <strong>Duplicate Debits:</strong> In rare cases where a customer is charged twice for a single order due to multiple clicks, the duplicate charge will be verified by our finance team and refunded within <strong>5 to 7 working days</strong>.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                3. Event Cancellation by Organizers
              </h2>
              <p>
                In the unforeseen event that Sabrang 2026 is cancelled entirely by the university authorities due to unavoidable circumstances, regulatory restrictions, or force majeure events without an alternative rescheduled date:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-white/75">
                <li>Ticket holders will be entitled to a <strong>100% full refund</strong> of their registration fee.</li>
                <li>Refunds will be initiated automatically to the original payment source through the Cashfree payment gateway within <strong>7 to 10 working days</strong> of the official cancellation announcement.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                4. Refund Method and Currency
              </h2>
              <p>
                All approved refunds will be credited strictly back to the <strong>original source of payment</strong> (the exact bank account, card, or UPI VPA from which the payment was initiated). We do not issue cash refunds, third-party wallet transfers, or alternative payee disbursements under any circumstances. All refunds are processed in <strong>Indian Rupees (INR / ₹)</strong>.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3 border-t border-white/10 pt-6">
              <h2 className="text-xl font-bold text-white tracking-wide">
                5. How to Request Assistance or Report a Dispute
              </h2>
              <p>
                If you have not received your automatic refund after 7 working days for a failed debit, or have questions regarding your transaction status, please email our support desk with:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 text-white/75">
                <li>Your full name and registered mobile number</li>
                <li>Order ID and Cashfree Transaction Reference Number</li>
                <li>Bank debit statement / transaction screenshot showing the timestamp and reference number</li>
              </ul>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 font-mono text-xs sm:text-sm text-white/80 space-y-1 mt-4">
                <p className="font-bold text-white">Payment Helpdesk & Dispute Resolution</p>
                <p>{SITE_CONFIG.university.name}</p>
                <p>Email: <a href="mailto:sabrang@jklu.edu.in" className="text-purple-400 underline">sabrang@jklu.edu.in</a></p>
                <p>Response Time: Within 24-48 business hours</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

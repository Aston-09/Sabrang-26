export const metadata = {
  title: 'Why Sponsor Us - Sabrang 2025',
  description: 'Sponsorship opportunities for Sabrang 2025',
};

export default function SponsorPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Why Sponsor Us</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Partner with Rajasthan's biggest college festival and reach thousands of young minds
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { number: '5000+', label: 'Expected Footfall' },
          { number: '50+', label: 'Colleges' },
          { number: '100K+', label: 'Social Media Reach' },
          { number: '3 Days', label: 'Brand Exposure' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 text-center shadow-sm">
            <div className="text-4xl font-black text-indigo-600 mb-2">{stat.number}</div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Benefits */}
      <section className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Sponsorship Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Brand Visibility',
              desc: 'Your brand logo on all marketing materials, banners, posters, and digital platforms reaching 5000+ students.',
              icon: '👁️',
            },
            {
              title: 'Social Media Promotion',
              desc: 'Dedicated posts and stories on our Instagram, Facebook, and LinkedIn pages with 100K+ combined reach.',
              icon: '📱',
            },
            {
              title: 'On-Ground Activation',
              desc: 'Set up stalls, booths, or interactive zones to engage directly with participants throughout the festival.',
              icon: '🎪',
            },
            {
              title: 'Networking Opportunities',
              desc: 'Connect with talented students, faculty, and industry leaders from across Rajasthan.',
              icon: '🤝',
            },
            {
              title: 'Recruitment Pipeline',
              desc: 'Access to participant database for internships, placements, and hiring opportunities.',
              icon: '💼',
            },
            {
              title: 'Media Coverage',
              desc: 'Brand mentions in press releases, news coverage, and post-event reports.',
              icon: '📰',
            },
          ].map((benefit, i) => (
            <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-3xl flex-shrink-0">{benefit.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsorship Tiers */}
      <section className="space-y-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">Sponsorship Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              tier: 'Title Sponsor',
              price: '₹2,00,000',
              color: 'from-amber-500 to-orange-600',
              benefits: [
                'Festival naming rights',
                'Prime branding everywhere',
                'Keynote speaking opportunity',
                'VIP passes (20)',
                'Exclusive stall space',
                'Full database access',
              ],
            },
            {
              tier: 'Gold Sponsor',
              price: '₹1,00,000',
              color: 'from-indigo-500 to-purple-600',
              benefits: [
                'Logo on all materials',
                'Social media campaign',
                'Premium stall location',
                'VIP passes (10)',
                'Stage branding',
                'Database access',
              ],
              popular: true,
            },
            {
              tier: 'Silver Sponsor',
              price: '₹50,000',
              color: 'from-slate-500 to-slate-700',
              benefits: [
                'Logo on banners',
                'Social media mention',
                'Standard stall',
                'VIP passes (5)',
                'Certificate of appreciation',
                'Basic database access',
              ],
            },
          ].map((tier, i) => (
            <div key={i} className={`bg-white rounded-3xl border-2 ${tier.popular ? 'border-indigo-600 shadow-xl scale-105' : 'border-slate-100 shadow-sm'} overflow-hidden relative`}>
              {tier.popular && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className={`bg-gradient-to-br ${tier.color} p-6 text-white text-center`}>
                <h3 className="text-2xl font-black mb-2">{tier.tier}</h3>
                <div className="text-4xl font-black">{tier.price}</div>
              </div>
              <div className="p-6 space-y-3">
                {tier.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-slate-700 text-sm">{benefit}</span>
                  </div>
                ))}
                <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-12 rounded-3xl text-center">
        <h2 className="text-3xl font-black mb-4 tracking-tight">Become a Sponsor</h2>
        <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
          Join hands with us to create an unforgettable experience for thousands of students. Let's build something amazing together!
        </p>
        <a 
          href="/contact" 
          className="inline-block bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
        >
          Contact Sponsorship Team
        </a>
      </section>
    </div>
  );
}

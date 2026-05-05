export const metadata = {
  title: 'About - Sabrang 2025',
  description: 'Learn more about Sabrang, the annual flagship festival of JK Lakshmipat University',
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">About Sabrang</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          The grandest cultural & techno-management festival of Rajasthan
        </p>
      </section>

      {/* Main Content */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">What is Sabrang?</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Sabrang is the annual flagship festival of JK Lakshmipat University, celebrating the vibrant colors of talent, innovation, and culture. It brings together students from across the nation to showcase their skills, creativity, and passion.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            From flagship events like <span className="font-bold text-slate-900">Panache</span> (Fashion Show) to intense e-sports battles and soulful musical nights, Sabrang offers a platform for students to shine and create unforgettable memories.
          </p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl aspect-square flex items-center justify-center p-12 shadow-2xl">
          <div className="text-white text-center space-y-4">
            <div className="text-6xl font-black">SABRANG</div>
            <div className="text-2xl font-bold">2025</div>
            <div className="text-lg opacity-90">October 10-12</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { number: '50+', label: 'Events' },
          { number: '₹2.5L+', label: 'Prize Pool' },
          { number: '3 Days', label: 'Festival' },
          { number: '5000+', label: 'Attendees' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 text-center shadow-sm">
            <div className="text-4xl font-black text-indigo-600 mb-2">{stat.number}</div>
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Our Mission</h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-6">
          Sabrang aims to foster creativity, innovation, and cultural exchange among students. We believe in providing a platform where talent meets opportunity, and where every participant can discover their potential and celebrate diversity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
            { title: 'Celebrate Talent', desc: 'Showcase your skills on a grand stage' },
            { title: 'Build Community', desc: 'Connect with like-minded individuals' },
            { title: 'Create Memories', desc: 'Experience unforgettable moments' },
          ].map((item, i) => (
            <div key={i} className="bg-indigo-50 p-6 rounded-2xl">
              <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Venue */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-10 rounded-3xl">
        <h2 className="text-3xl font-black mb-6 tracking-tight">Venue</h2>
        <div className="space-y-4">
          <p className="text-xl font-bold">JK Lakshmipat University</p>
          <p className="text-slate-300">Mahapura, Ajmer Road</p>
          <p className="text-slate-300">Jaipur, Rajasthan 302026</p>
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400">A state-of-the-art campus with world-class facilities, providing the perfect backdrop for three days of celebration, competition, and cultural exchange.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

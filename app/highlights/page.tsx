export const metadata = {
  title: 'Highlights - Sabrang 2025',
  description: 'Discover the exciting highlights of Sabrang 2025',
};

export default function HighlightsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Festival Highlights</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Experience the magic of Sabrang 2025
        </p>
      </section>

      {/* Main Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Flagship Events',
            desc: 'Elite competitions like Panache (Fashion), Bandjam (Battle of Bands), and Step-Up (Dance) that showcase extraordinary talent.',
            icon: '🌟',
            color: 'from-indigo-500 to-blue-600',
          },
          {
            title: 'Professional Shows',
            desc: 'Groove to the beats of celebrity artists, live bands, and explosive DJ nights that will keep you dancing till dawn.',
            icon: '🎵',
            color: 'from-purple-500 to-pink-600',
          },
          {
            title: 'Huge Cash Prizes',
            desc: 'Total prize pool exceeding ₹2.5 Lakhs distributed across all technical and cultural events.',
            icon: '💰',
            color: 'from-amber-500 to-orange-600',
          },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className={`bg-gradient-to-br ${item.color} p-8 text-white text-center`}>
              <div className="text-6xl mb-4">{item.icon}</div>
              <h3 className="text-2xl font-black">{item.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Event Categories */}
      <section className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Event Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { category: 'Flagship Events', events: 'Panache, Bandjam, Step-Up', desc: 'The crown jewels of Sabrang' },
            { category: 'Cultural', events: 'Dance, Music, Drama, Art', desc: 'Celebrate diversity and creativity' },
            { category: 'Technical', events: 'Hackathons, Robotics, Coding', desc: 'Innovation meets competition' },
            { category: 'E-Sports', events: 'Valorant, BGMI, FIFA', desc: 'Digital battleground' },
            { category: 'Management', events: 'Business Quizzes, Case Studies', desc: 'Leadership and strategy' },
            { category: 'Literary', events: 'Debates, Poetry, Storytelling', desc: 'Words that inspire' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.category}</h3>
              <p className="text-sm font-semibold text-indigo-600 mb-2">{item.events}</p>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Special Attractions */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-10 rounded-3xl">
        <h2 className="text-3xl font-black mb-8 tracking-tight">Special Attractions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: 'Celebrity Performances',
              desc: 'Live concerts featuring renowned artists and bands that will electrify the stage.',
            },
            {
              title: 'Workshop & Masterclasses',
              desc: 'Learn from industry experts in photography, music production, and more.',
            },
            {
              title: 'Food Festival',
              desc: 'Savor delicious cuisines from local vendors and food trucks.',
            },
            {
              title: 'Photography Contest',
              desc: 'Capture the essence of Sabrang and win exciting prizes.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur p-6 rounded-2xl border border-white/20">
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Attend */}
      <section className="text-center bg-indigo-50 p-12 rounded-3xl">
        <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">Why You Should Attend</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            'Network with talented individuals',
            'Compete for amazing prizes',
            'Learn new skills and techniques',
            'Experience cultural diversity',
            'Create lifelong memories',
            'Showcase your talent',
          ].map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
              <p className="font-semibold text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

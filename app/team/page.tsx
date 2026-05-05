export const metadata = {
  title: 'Our Team - Sabrang 2025',
  description: 'Meet the team behind Sabrang 2025',
};

export default function TeamPage() {
  const teams = [
    {
      role: 'Faculty Advisors',
      members: [
        { name: 'Dr. Rajesh Sharma', position: 'Festival Director' },
        { name: 'Prof. Anita Verma', position: 'Event Coordinator' },
      ],
    },
    {
      role: 'Core Committee',
      members: [
        { name: 'Amit Kumar', position: 'General Secretary' },
        { name: 'Priya Singh', position: 'Joint Secretary' },
        { name: 'Rahul Verma', position: 'Treasurer' },
        { name: 'Sneha Kapur', position: 'Event Head' },
      ],
    },
    {
      role: 'Technical Team',
      members: [
        { name: 'Karan Johar', position: 'Technical Lead' },
        { name: 'Ishaan Khattar', position: 'Web Developer' },
        { name: 'Neha Gupta', position: 'App Developer' },
      ],
    },
    {
      role: 'Creative Team',
      members: [
        { name: 'Ananya Patel', position: 'Design Head' },
        { name: 'Vikram Rao', position: 'Content Lead' },
        { name: 'Meera Joshi', position: 'Social Media Manager' },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Our Team</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          The passionate individuals making Sabrang 2025 a reality
        </p>
      </section>

      {/* Teams */}
      {teams.map((team, teamIndex) => (
        <section key={teamIndex} className="space-y-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{team.role}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.members.map((member, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-sm text-indigo-600 font-semibold">{member.position}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Join Us */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-12 rounded-3xl text-center">
        <h2 className="text-3xl font-black mb-4 tracking-tight">Want to Join Our Team?</h2>
        <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
          We're always looking for passionate individuals to join our volunteer team. Be part of the biggest college festival in Rajasthan!
        </p>
        <a 
          href="/contact" 
          className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
        >
          Contact Us
        </a>
      </section>
    </div>
  );
}

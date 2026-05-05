export const metadata = {
  title: 'Schedule - Sabrang 2025',
  description: 'Complete event schedule for Sabrang 2025',
};

export default function SchedulePage() {
  const schedule = {
    'Day 1 - October 10, 2025': [
      { time: '9:00 AM', event: 'Opening Ceremony', venue: 'Main Stage', type: 'Ceremony' },
      { time: '11:00 AM', event: 'Technical Hackathon Begins', venue: 'Computer Lab', type: 'Technical' },
      { time: '2:00 PM', event: 'Step Up - Solo Dance', venue: 'Auditorium', type: 'Cultural' },
      { time: '4:00 PM', event: 'Robotics Competition', venue: 'Engineering Block', type: 'Technical' },
      { time: '6:00 PM', event: 'Panache - Rampwalk (Prelims)', venue: 'Main Stage', type: 'Flagship' },
      { time: '8:00 PM', event: 'DJ Night', venue: 'OAT', type: 'Entertainment' },
    ],
    'Day 2 - October 11, 2025': [
      { time: '10:00 AM', event: 'Business Quiz', venue: 'Seminar Hall', type: 'Management' },
      { time: '11:00 AM', event: 'Gunj - Vocal Solo', venue: 'Seminar Hall', type: 'Cultural' },
      { time: '2:00 PM', event: 'E-Sports Tournament Begins', venue: 'Computer Lab 1', type: 'E-Sports' },
      { time: '3:00 PM', event: 'Debate Competition', venue: 'Lecture Hall', type: 'Literary' },
      { time: '5:00 PM', event: 'Bandjam - Battle of Bands', venue: 'OAT', type: 'Flagship' },
      { time: '7:00 PM', event: 'Stand-up Comedy Show', venue: 'Main Stage', type: 'Entertainment' },
    ],
    'Day 3 - October 12, 2025': [
      { time: '9:00 AM', event: 'Art Exhibition', venue: 'Gallery', type: 'Cultural' },
      { time: '10:00 AM', event: 'E-Sports Finals', venue: 'Computer Lab 1', type: 'E-Sports' },
      { time: '12:00 PM', event: 'Panache - Rampwalk (Finals)', venue: 'Main Stage', type: 'Flagship' },
      { time: '3:00 PM', event: 'Prize Distribution', venue: 'Main Stage', type: 'Ceremony' },
      { time: '5:00 PM', event: 'Closing Ceremony', venue: 'Main Stage', type: 'Ceremony' },
      { time: '7:00 PM', event: 'Farewell Concert', venue: 'Main Stage', type: 'Entertainment' },
    ],
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Flagship: 'bg-purple-100 text-purple-700',
      Cultural: 'bg-blue-100 text-blue-700',
      Technical: 'bg-green-100 text-green-700',
      'E-Sports': 'bg-red-100 text-red-700',
      Management: 'bg-amber-100 text-amber-700',
      Literary: 'bg-indigo-100 text-indigo-700',
      Ceremony: 'bg-slate-100 text-slate-700',
      Entertainment: 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Event Schedule</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Three days of non-stop action, entertainment, and competition
        </p>
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-full font-bold">
          <span>📅</span>
          <span>October 10-12, 2025</span>
        </div>
      </section>

      {/* Schedule */}
      {Object.entries(schedule).map(([day, events]) => (
        <section key={day} className="space-y-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{day}</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y">
              {events.map((item, index) => (
                <div key={index} className="p-6 hover:bg-slate-50 transition-colors grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="font-bold text-slate-900 text-lg">{item.time}</div>
                  <div className="md:col-span-2">
                    <div className="font-bold text-slate-900 text-lg">{item.event}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <span>📍</span>
                      <span>{item.venue}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Note */}
      <section className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="text-2xl">⚠️</div>
          <div>
            <h3 className="font-bold text-amber-900 mb-2">Important Notes</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Schedule is subject to change. Please check for updates regularly.</li>
              <li>Participants must report 30 minutes before their event.</li>
              <li>Venue changes will be announced on our social media channels.</li>
              <li>Some events may have preliminary rounds on previous days.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

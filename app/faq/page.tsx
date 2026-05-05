export const metadata = {
  title: 'FAQ - Sabrang 2025',
  description: 'Frequently asked questions about Sabrang 2025',
};

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is Sabrang?',
      answer: 'Sabrang is the annual flagship cultural and techno-management festival of JK Lakshmipat University, Jaipur. It features 50+ events including cultural competitions, technical challenges, e-sports tournaments, and professional shows over three days.',
    },
    {
      question: 'When and where is Sabrang 2025?',
      answer: 'Sabrang 2025 will be held from October 10-12, 2025, at JK Lakshmipat University, Mahapura, Ajmer Road, Jaipur, Rajasthan 302026.',
    },
    {
      question: 'Who can participate?',
      answer: 'All college students from recognized universities across India can participate in Sabrang. Some events may have specific eligibility criteria, so please check individual event details.',
    },
    {
      question: 'How do I register for events?',
      answer: 'Create an account on our website, browse the events page, and click "Register Now" for any event you\'re interested in. You\'ll receive a unique QR code for entry.',
    },
    {
      question: 'Is there an entry fee?',
      answer: 'Entry to the festival is free for JKLU students. External participants may need to pay a nominal registration fee for certain events. Check individual event pages for details.',
    },
    {
      question: 'What is the total prize pool?',
      answer: 'The total prize pool exceeds ₹2.5 Lakhs, distributed across all technical, cultural, and flagship events.',
    },
    {
      question: 'Can I participate in multiple events?',
      answer: 'Yes! You can register for as many events as you want, provided there are no scheduling conflicts.',
    },
    {
      question: 'Will there be accommodation available?',
      answer: 'Yes, limited accommodation is available on campus on a first-come, first-served basis. Please contact us in advance to arrange accommodation.',
    },
    {
      question: 'Is food available on campus?',
      answer: 'Absolutely! We\'ll have a food festival with multiple vendors offering a variety of cuisines. Food courts will be operational throughout the festival.',
    },
    {
      question: 'How do I get my QR code?',
      answer: 'After successful registration for any event, your unique QR code will be available in your dashboard. You can also find the QR string below the code for manual entry.',
    },
    {
      question: 'Can I get a refund if I cancel my registration?',
      answer: 'Refund policies vary by event. Please check the specific event\'s terms and conditions or contact our support team.',
    },
    {
      question: 'Is there parking available?',
      answer: 'Yes, parking is available on campus for both two-wheelers and four-wheelers. Follow the signage on the day of the event.',
    },
    {
      question: 'Are outside food/drinks allowed?',
      answer: 'Outside food and drinks are not permitted inside the venue. However, we have plenty of food options available at affordable prices.',
    },
    {
      question: 'How can I volunteer for Sabrang?',
      answer: 'We\'re always looking for enthusiastic volunteers! Fill out the contact form on our website or email us at sabrang@jklu.edu.in with your details.',
    },
    {
      question: 'Can I sponsor Sabrang?',
      answer: 'Yes! We offer various sponsorship packages. Visit our "Why Sponsor Us" page or contact our sponsorship team for more details.',
    },
    {
      question: 'Will there be live streaming of events?',
      answer: 'Select events will be live-streamed on our social media channels. Follow us on Instagram and YouTube for updates.',
    },
    {
      question: 'What should I bring to the festival?',
      answer: 'Bring your college ID, registration QR code, comfortable clothes, and lots of energy! Some events may require specific equipment - check event rules.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">FAQ</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Got questions? We've got answers!
        </p>
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        {faqs.map((faq, index) => (
          <details key={index} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <summary className="flex justify-between items-center cursor-pointer p-6 hover:bg-slate-50 transition-colors list-none">
              <h3 className="text-lg font-bold text-slate-900 pr-4">{faq.question}</h3>
              <span className="text-2xl text-indigo-600 font-bold transition-transform group-open:rotate-45 flex-shrink-0">
                +
              </span>
            </summary>
            <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              {faq.answer}
            </div>
          </details>
        ))}
      </section>

      {/* Still have questions */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-10 rounded-3xl text-center">
        <h2 className="text-2xl font-black mb-4 tracking-tight">Still Have Questions?</h2>
        <p className="text-indigo-100 mb-6">
          Can't find what you're looking for? Feel free to reach out to us!
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

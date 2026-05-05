import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'Contact Us - Sabrang 2025',
  description: 'Get in touch with the Sabrang 2025 team',
};

export default function ContactPage() {

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Contact Us</h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Have questions or want to collaborate? We'd love to hear from you!
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Send us a Message</h2>
          <ContactForm />
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          {/* Quick Contact */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 rounded-3xl">
            <h2 className="text-2xl font-black mb-6 tracking-tight">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl">📧</div>
                <div>
                  <h3 className="font-bold mb-1">Email</h3>
                  <p className="text-indigo-100">sabrang@jklu.edu.in</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="text-2xl">📞</div>
                <div>
                  <h3 className="font-bold mb-1">Phone</h3>
                  <p className="text-indigo-100">+91 98765 43210</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="text-2xl">📍</div>
                <div>
                  <h3 className="font-bold mb-1">Address</h3>
                  <p className="text-indigo-100">JK Lakshmipat University<br />Mahapura, Ajmer Road<br />Jaipur, Rajasthan 302026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Follow Us</h2>
            <div className="space-y-3">
              {[
                { name: 'Instagram', handle: '@sabrang.jklu', icon: '📸', url: '#' },
                { name: 'Facebook', handle: 'Sabrang JKLU', icon: '👍', url: '#' },
                { name: 'Twitter', handle: '@sabrang2025', icon: '🐦', url: '#' },
                { name: 'YouTube', handle: 'Sabrang Official', icon: '🎥', url: '#' },
                { name: 'LinkedIn', handle: 'Sabrang JKLU', icon: '💼', url: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-colors group"
                >
                  <div className="text-2xl">{social.icon}</div>
                  <div className="flex-grow">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600">{social.name}</div>
                    <div className="text-sm text-slate-500">{social.handle}</div>
                  </div>
                  <div className="text-slate-400 group-hover:text-indigo-600">→</div>
                </a>
              ))}
            </div>
          </div>

          {/* Office Hours */}
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <span>🕒</span>
              <span>Office Hours</span>
            </h3>
            <div className="text-sm text-amber-800 space-y-1">
              <p>Monday - Friday: 10:00 AM - 5:00 PM</p>
              <p>Saturday: 10:00 AM - 2:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

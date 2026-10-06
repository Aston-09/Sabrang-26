const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/auth/CheckoutForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Labels
content = content.replace(/text-xs font-mono text-white\/60 uppercase tracking-widest/g, 'text-sm font-medium text-white/80');
content = content.replace(/text-xs font-mono/g, 'text-sm text-white/80');

// Inputs
content = content.replace(/bg-black\/40 border rounded-lg/g, 'bg-white/5 border border-white/10 rounded-lg focus:bg-white/10');
content = content.replace(/placeholder-white\/20/g, 'placeholder-white/40');

// Remove excessive glow and caps
content = content.replace(/absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 opacity-50/g, 'hidden');
content = content.replace(/text-xl font-bold uppercase tracking-wider/g, 'text-xl font-semibold text-white');
content = content.replace(/font-mono/g, 'font-sans'); // remove all other mono fonts

fs.writeFileSync(filePath, content, 'utf8');
console.log('Styles updated.');

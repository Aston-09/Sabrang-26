import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

const events = [
  {
    title: "PANACHE - RAMPWALK",
    description: "The flagship fashion show of Sabrang. Showcase your style, confidence, and walk on the grand stage.",
    category: "Flagship",
    dateTime: new Date("2025-10-10T18:00:00"),
    venue: "Main Stage",
    rules: "1. Team size: 8-12 members.\n2. Duration: 8-10 minutes.\n3. Theme is open but must be decent.\n4. Judgment based on walk, costume, and synchronization.",
    maxParticipants: 15,
    prizePool: "₹50,000",
    coordinators: [{ name: "Amit Sharma", phone: "9876543210" }, { name: "Priya Singh", phone: "9876543211" }],
    createdAt: new Date()
  },
  {
    title: "BANDJAM - BATTLE OF BANDS",
    description: "Bring the house down with your rock and roll vibes. A competition for the best college bands.",
    category: "Flagship",
    dateTime: new Date("2025-10-11T17:00:00"),
    venue: "OAT",
    rules: "1. Minimum 3 members per band.\n2. Time limit: 15 minutes including setup.\n3. Own instruments must be brought (except drum kit).",
    maxParticipants: 10,
    prizePool: "₹30,000",
    coordinators: [{ name: "Rahul Verma", phone: "9876543212" }],
    createdAt: new Date()
  },
  {
    title: "STEP UP - SOLO DANCE",
    description: "Express yourself through movement. Show us your best solo dance routine.",
    category: "Cultural",
    dateTime: new Date("2025-10-10T14:00:00"),
    venue: "Auditorium",
    rules: "1. Duration: 2-3 minutes.\n2. Music must be submitted in pendrive 1 hour prior.\n3. No props that leave residue on stage.",
    maxParticipants: 50,
    prizePool: "₹10,000",
    coordinators: [{ name: "Sneha Kapur", phone: "9876543213" }],
    createdAt: new Date()
  },
  {
    title: "VALORANT SHOWDOWN",
    description: "Compete in the ultimate tactical shooter tournament. 5v5 battle for supremacy.",
    category: "E-Sports",
    dateTime: new Date("2025-10-12T10:00:00"),
    venue: "Computer Lab 1",
    rules: "1. 5v5 Single Elimination.\n2. Standard tournament maps.\n3. Hacks/Cheats lead to immediate disqualification.",
    maxParticipants: 32,
    prizePool: "₹20,000",
    coordinators: [{ name: "Karan Johar", phone: "9876543214" }],
    createdAt: new Date()
  },
  {
    title: "GUNJ - VOCAL SOLO",
    description: "The singing competition of Sabrang. Classical, Semi-classical or Bollywood - show your vocal prowess.",
    category: "Cultural",
    dateTime: new Date("2025-10-11T11:00:00"),
    venue: "Seminar Hall",
    rules: "1. Duration: 4 minutes.\n2. One instrument or track allowed for accompaniment.",
    maxParticipants: 40,
    prizePool: "₹8,000",
    coordinators: [{ name: "Ishaan Khattar", phone: "9876543215" }],
    createdAt: new Date()
  }
];

async function seed() {
  console.log("Seeding realistic Sabrang events...");
  for (const event of events) {
    await db.collection('events').add(event);
    console.log(`Added: ${event.title}`);
  }
  console.log("Seeding complete!");
}

seed().catch(console.error);

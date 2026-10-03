/**
 * Sabrang 2026 — Official Events Catalog & Authoritative Pricing Matrix
 * Single source of truth for events, team rules, prize pools, and registration pricing.
 */

export interface SabrangEvent {
  id: string;
  title: string;
  subtitle: string;
  category: 
    | "Flagship Events – Team"
    | "Flagship Events – Solo / Duo"
    | "Non-Flagship – Esports"
    | "Non-Flagship – Other Events"
    | "Activities – Gifts & Hampers"
    | "General Entry";
  minTeam: number;
  maxTeam: number;
  baseIncludedMembers: number;
  basePrice: number;
  price: number;
  extraMemberFee: number;
  isTeam: boolean;
  type: "generic" | "bgmi" | "valorant" | "freefire" | "visitor";
  pricingLabel: string;
  prizes: {
    winnerCash?: number;
    runnerUpCash?: number;
    totalCash?: number;
    remarks?: string;
  };
}

export const VAAD_VIVAAD_REPRESENTATIVES = [
  "Narendra Modi",
  "Rahul Gandhi",
  "Amit Shah",
  "Rajnath Singh",
  "Nitin Gadkari",
  "Piyush Goyal",
  "Kiren Rijiju",
  "Shashi Tharoor",
  "Asaduddin Owaisi",
  "Mahua Moitra",
  "Supriya Sule",
  "Dimple Yadav",
  "Akhilesh Yadav",
  "Hema Malini",
  "Kangana Ranaut",
  "Manoj Tiwari",
  "Ravi Kishan",
  "Kanhaiya Kumar",
  "Gaurav Gogoi",
  "Derek O’Brien",
  "Abhishek Banerjee",
  "Saugata Roy",
  "Dayanidhi Maran",
  "Kanimozhi Karunanidhi",
  "T. R. Baalu",
  "Chirag Paswan",
  "Anurag Thakur",
  "Tejasvi Surya",
  "Mahua Maji",
  "Arjun Ram Meghwal",
  "Ravish Kumar",
  "Rajdeep Sardesai",
  "Barkha Dutt",
  "Shekhar Gupta",
  "Arnab Goswami",
  "Nidhi Razdan",
  "Sagarika Ghose",
  "Faye D’Souza",
  "Karan Thapar",
  "Anubha Bhonsle",
] as const;

const RAW_EVENTS: Omit<SabrangEvent, 'price'>[] = [
  // --- Flagship Events – Team ---
  {
    id: "panache",
    title: "Panache",
    subtitle: "Haute Couture Runway Show",
    category: "Flagship Events – Team",
    minTeam: 6,
    maxTeam: 18,
    baseIncludedMembers: 6,
    basePrice: 2999,
    extraMemberFee: 599,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹2,999 (covers up to 6 members, +₹599/extra member)",
    prizes: {
      winnerCash: 21000,
      runnerUpCash: 14000,
      totalCash: 35000,
    },
  },
  {
    id: "sync",
    title: "SYNC",
    subtitle: "Group Dance Showdown",
    category: "Flagship Events – Team",
    minTeam: 8,
    maxTeam: 25,
    baseIncludedMembers: 8,
    basePrice: 2999,
    extraMemberFee: 599,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹2,999 (covers up to 8 members, +₹599/extra member)",
    prizes: {
      winnerCash: 21000,
      runnerUpCash: 14000,
      totalCash: 35000,
    },
  },
  {
    id: "bandjam",
    title: "Band Jam",
    subtitle: "Battle of the Bands",
    category: "Flagship Events – Team",
    minTeam: 4,
    maxTeam: 8,
    baseIncludedMembers: 4,
    basePrice: 1799,
    extraMemberFee: 599,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹1,799 (covers up to 4 members, +₹599/extra member)",
    prizes: {
      winnerCash: 15000,
      runnerUpCash: 10000,
      totalCash: 25000,
    },
  },

  // --- Flagship Events – Solo / Duo ---
  {
    id: "step_up",
    title: "Step Up",
    subtitle: "Solo Dance Competition",
    category: "Flagship Events – Solo / Duo",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 699,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹699 per head",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },
  {
    id: "echoes_of_noor",
    title: "Echoes of Noor",
    subtitle: "Sufi Night & Acoustic Melodies",
    category: "Flagship Events – Solo / Duo",
    minTeam: 1,
    maxTeam: 2,
    baseIncludedMembers: 1,
    basePrice: 699,
    extraMemberFee: 699,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹699 per head (Solo ₹699 / Duo ₹1,398)",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },
  {
    id: "versevaad",
    title: "Verse Vaad",
    subtitle: "Poetry Slam & Literary Debates",
    category: "Flagship Events – Solo / Duo",
    minTeam: 1,
    maxTeam: 2,
    baseIncludedMembers: 1,
    basePrice: 699,
    extraMemberFee: 699,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹699 per head (Solo ₹699 / Duo ₹1,398)",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },

  // --- Non-Flagship – Esports ---
  {
    id: "bgmi",
    title: "BGMI",
    subtitle: "Battlegrounds Mobile India Tournament",
    category: "Non-Flagship – Esports",
    minTeam: 4,
    maxTeam: 5,
    baseIncludedMembers: 5,
    basePrice: 749,
    extraMemberFee: 0,
    isTeam: true,
    type: "bgmi",
    pricingLabel: "₹749 per team",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
      remarks: "Fee is per team",
    },
  },
  {
    id: "freefire",
    title: "Free Fire",
    subtitle: "Free Fire Mobile Esports Tournament",
    category: "Non-Flagship – Esports",
    minTeam: 4,
    maxTeam: 5,
    baseIncludedMembers: 5,
    basePrice: 699,
    extraMemberFee: 0,
    isTeam: true,
    type: "freefire",
    pricingLabel: "₹699 per team",
    prizes: {
      winnerCash: 7000,
      runnerUpCash: 5000,
      totalCash: 12000,
      remarks: "Fee is per team",
    },
  },
  {
    id: "valorant",
    title: "Valorant",
    subtitle: "5v5 PC Tactical FPS Tournament",
    category: "Non-Flagship – Esports",
    minTeam: 5,
    maxTeam: 5,
    baseIncludedMembers: 5,
    basePrice: 599,
    extraMemberFee: 0,
    isTeam: true,
    type: "valorant",
    pricingLabel: "₹599 per team",
    prizes: {
      winnerCash: 6000,
      runnerUpCash: 4000,
      totalCash: 10000,
      remarks: "Fee is per team",
    },
  },

  // --- Non-Flagship – Other Events ---
  {
    id: "rang_manch",
    title: "Rang Manch",
    subtitle: "Stage Play & Theatrical Drama",
    category: "Non-Flagship – Other Events",
    minTeam: 8,
    maxTeam: 16,
    baseIncludedMembers: 8,
    basePrice: 2499,
    extraMemberFee: 499,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹2,499 (covers up to 8 members, +₹499/extra member)",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },
  {
    id: "courtroom",
    title: "Court Room",
    subtitle: "Mock Trial & Legal Battle",
    category: "Non-Flagship – Other Events",
    minTeam: 3,
    maxTeam: 4,
    baseIncludedMembers: 3,
    basePrice: 899,
    extraMemberFee: 299,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹899 (covers up to 3 members, +₹299/extra member)",
    prizes: {
      winnerCash: 6000,
      runnerUpCash: 4000,
      totalCash: 10000,
    },
  },
  {
    id: "bidding",
    title: "Bidding Before Wicket",
    subtitle: "IPL Mock Cricket Auction",
    category: "Non-Flagship – Other Events",
    minTeam: 3,
    maxTeam: 5,
    baseIncludedMembers: 3,
    basePrice: 899,
    extraMemberFee: 299,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹899 (covers up to 3 members, +₹299/extra member)",
    prizes: {
      winnerCash: 6000,
      runnerUpCash: 4000,
      totalCash: 10000,
    },
  },
  {
    id: "dumb_show",
    title: "Dumb Show",
    subtitle: "Mime & Dumb Charades",
    category: "Non-Flagship – Other Events",
    minTeam: 3,
    maxTeam: 3,
    baseIncludedMembers: 3,
    basePrice: 899,
    extraMemberFee: 0,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹899 per team (3 members)",
    prizes: {
      winnerCash: 4000,
      runnerUpCash: 3000,
      totalCash: 7000,
    },
  },
  {
    id: "vaad_vivaad",
    title: "Vaad Vivaad",
    subtitle: "Conventional Debate Competition (Solo)",
    category: "Non-Flagship – Other Events",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 299,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹299 per head",
    prizes: {
      winnerCash: 3500,
      runnerUpCash: 2500,
      totalCash: 6000,
    },
  },
  {
    id: "face_off",
    title: "Face Off",
    subtitle: "Street Dance Face Off (Solo)",
    category: "Non-Flagship – Other Events",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 299,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹299 per head",
    prizes: {
      totalCash: 12000,
      remarks: "2 styles, no runner-up; ₹6,000 per category",
    },
  },

  // --- Activities – Gifts & Hampers (No Cash Prize) ---
  {
    id: "anime_quiz",
    title: "Anime Quiz",
    subtitle: "Ultimate Otaku Trivia Challenge",
    category: "Activities – Gifts & Hampers",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 111,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹111 per head",
    prizes: {
      remarks: "Gifts & Hampers",
    },
  },
  {
    id: "art_relay",
    title: "Art Relay",
    subtitle: "Collaborative Fine Arts Challenge",
    category: "Activities – Gifts & Hampers",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 111,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹111 per head",
    prizes: {
      remarks: "Gifts & Hampers",
    },
  },
  {
    id: "clay_modelling",
    title: "Clay Modelling",
    subtitle: "Sculptural Creativity & Craft",
    category: "Activities – Gifts & Hampers",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 111,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹111 per head",
    prizes: {
      remarks: "Gifts & Hampers",
    },
  },
  {
    id: "chai_pe_charcha",
    title: "Chai Pe Charcha",
    subtitle: "Conversations & Open Mic Session",
    category: "Activities – Gifts & Hampers",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 111,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹111 per head",
    prizes: {
      remarks: "Gifts & Hampers",
    },
  },

  // --- General Entry ---
  {
    id: "visitor",
    title: "Visitor Pass",
    subtitle: "Festival Entry & Concert Access",
    category: "General Entry",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 69,
    extraMemberFee: 0,
    isTeam: false,
    type: "visitor",
    pricingLabel: "₹69 per pass",
    prizes: { remarks: "Access to fest zone & live performances" },
  },
];

export const OFFICIAL_EVENTS: SabrangEvent[] = RAW_EVENTS.map((e) => ({
  ...e,
  price: e.basePrice,
}));

export const EVENT_BY_ID: Record<string, SabrangEvent> = Object.fromEntries(
  OFFICIAL_EVENTS.map((e) => [e.id, e])
);

export function getEventById(id: string): SabrangEvent | undefined {
  return EVENT_BY_ID[id];
}

export const FESTIVAL_DAYS = [
  { id: "day1", label: "Day 1", date: "Oct 23" },
  { id: "day2", label: "Day 2", date: "Oct 24" },
  { id: "day3", label: "Day 3", date: "Oct 25" },
] as const;

export type FestivalDayId = (typeof FESTIVAL_DAYS)[number]["id"];

export interface VisitorPassConfig {
  count: number;
  days: string[];
}

export function calculateVisitorPassFee(count: number, daysCount: number): number {
  const people = Math.max(1, count || 1);
  const days = Math.max(1, daysCount || 1);
  return people * days * 69;
}

/**
 * Calculates the exact price for a given event given the number of team members (leader + extra members)
 * and optional visitorConfig for visitor passes.
 */
export function calculateEventItemPrice(
  event: SabrangEvent,
  totalMembers: number = 1,
  visitorConfig?: VisitorPassConfig
): number {
  if (event.id === "visitor") {
    const count = visitorConfig?.count ?? totalMembers ?? 1;
    const daysCount = visitorConfig?.days?.length ?? 1;
    return calculateVisitorPassFee(count, daysCount);
  }

  if (!event.isTeam) {
    return event.basePrice;
  }
  // Esports are flat per team
  if (event.type === "bgmi" || event.type === "freefire" || event.type === "valorant") {
    return event.basePrice;
  }
  // Fixed team (e.g. Dumb Show 3)
  if (event.extraMemberFee === 0) {
    return event.basePrice;
  }
  // Base covers up to baseIncludedMembers
  const members = Math.max(1, totalMembers);
  const extraCount = Math.max(0, members - event.baseIncludedMembers);
  return event.basePrice + extraCount * event.extraMemberFee;
}

/**
 * Calculates the total registration fee across all selected events taking into account
 * team member additions per group and visitor pass configuration.
 */
export function calculateTotalRegistrationFee(
  selectedEventIds: string[],
  teamMembersMap?: Record<string, any[] | undefined>,
  visitorConfig?: VisitorPassConfig
): number {
  if (!Array.isArray(selectedEventIds) || selectedEventIds.length === 0) {
    return 0;
  }

  let total = 0;

  for (const eventId of selectedEventIds) {
    const event = getEventById(eventId);
    if (!event) continue;

    if (eventId === "visitor") {
      total += calculateEventItemPrice(event, 1, visitorConfig);
      continue;
    }

    const groupMembers = teamMembersMap?.[event.type];
    const totalMembers = 1 + (Array.isArray(groupMembers) ? groupMembers.length : 0);

    total += calculateEventItemPrice(event, totalMembers);
  }

  return total;
}

/**
 * Computes minimum and maximum team requirements for an active group based on selected events.
 */
export function getGroupTeamRequirements(
  group: string,
  selectedEventIds: string[],
  visitorConfig?: VisitorPassConfig
): { min: number; max: number } {
  if (group === "visitor") {
    const count = Math.max(1, visitorConfig?.count || 1);
    return { min: count, max: count };
  }

  const groupEvents = selectedEventIds
    .map(id => getEventById(id))
    .filter((e): e is SabrangEvent => e !== undefined && e.type === group && e.isTeam);

  if (groupEvents.length === 0) {
    return { min: 1, max: 1 };
  }

  // Required min is the highest min of any selected team event in this group
  const min = Math.max(...groupEvents.map(e => e.minTeam));
  // Allowed max is the highest max of any selected team event in this group
  const max = Math.max(...groupEvents.map(e => e.maxTeam));

  return { min, max };
}

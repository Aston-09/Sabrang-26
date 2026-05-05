import { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "scanner" | "admin";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp | Date;
}

export interface Coupon {
  id?: string;
  code: string;
  discountPercentage: number;
  expiryDate: Timestamp | Date;
  active: boolean;
  createdAt: Timestamp | Date;
}

export interface Coordinator {
  name: string;
  phone: string;
}

export interface Event {
  id?: string;
  title: string;
  description: string;
  category: "Flagship" | "Cultural" | "Technical" | "E-Sports" | "Other";
  dateTime: Timestamp | Date;
  venue: string;
  rules: string;
  maxParticipants?: number;
  coordinators: Coordinator[];
  prizePool?: string;
  createdAt: Timestamp | Date;
}

export interface Registration {
  id?: string;
  userId: string;
  eventId: string;
  qrCode: string;
  referralCode: string;
  attended: boolean;
  attendedAt?: Timestamp | Date;
  checkedInBy?: string; // UID of admin/scanner
  createdAt: Timestamp | Date;
}

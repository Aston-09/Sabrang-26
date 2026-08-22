import type { Metadata } from 'next';
import VolunteerLayoutWrapper from '../../components/volunteer/VolunteerLayoutWrapper';

export const metadata: Metadata = {
  title: "Volunteer Portal",
  description: "Scoped operational dashboard for volunteer leaders and discipline controllers of Aarambh '26.",
  alternates: {
    canonical: '/volunteer',
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return <VolunteerLayoutWrapper>{children}</VolunteerLayoutWrapper>;
}


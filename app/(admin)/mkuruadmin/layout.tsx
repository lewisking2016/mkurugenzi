import type { Metadata } from 'next';
import AdminShell from './components/AdminShell';

export const metadata: Metadata = {
  title: 'Mkurugenzi Admin',
  description: 'Store operations for Mkurugenzi — products, promotions, clients and deliveries.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

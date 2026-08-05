import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole="Admin">
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

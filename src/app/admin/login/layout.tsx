// src/app/admin/login/layout.tsx
// ============================================
// Layout pour le login (SANS sidebar admin)
// ============================================

export default function AdminLoginLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg">
      {children}
    </div>
  );
}

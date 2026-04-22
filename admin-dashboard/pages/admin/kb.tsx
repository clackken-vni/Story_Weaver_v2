import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { ModuleShell } from '../../components/ModuleShell';

export default function KBPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <ModuleShell
          title="KB Operations"
          subtitle="Research jobs, source reliability"
          emptyState={{
            title: 'KB operations module is coming soon',
            description: 'Knowledge ingestion and reliability controls will be added here.',
          }}
        />
      </AdminShell>
    </AuthGuard>
  );
}
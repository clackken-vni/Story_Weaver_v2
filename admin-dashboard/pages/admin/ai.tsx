import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { ModuleShell } from '../../components/ModuleShell';

export default function AIPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <ModuleShell
          title="AI Operations"
          subtitle="Provider health, token usage, fallbacks"
          emptyState={{
            title: 'AI operations module is coming soon',
            description: 'Provider-level analytics and fallback controls will appear here.',
          }}
        />
      </AdminShell>
    </AuthGuard>
  );
}
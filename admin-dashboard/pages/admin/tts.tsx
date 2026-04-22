import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { ModuleShell } from '../../components/ModuleShell';

export default function TTSPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <ModuleShell
          title="TTS Operations"
          subtitle="Queue, provider SLA, artifacts"
          emptyState={{
            title: 'TTS operations module is coming soon',
            description: 'Queue visibility and SLA monitoring are planned for this module.',
          }}
        />
      </AdminShell>
    </AuthGuard>
  );
}
import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { ModuleShell } from '../../components/ModuleShell';

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <ModuleShell
          title="Projects & Wizard"
          subtitle="Project funnel and wizard runs"
          emptyState={{
            title: 'Projects pipeline is coming soon',
            description: 'Module shell is ready. Data workflows will be connected in the next phase.',
          }}
        />
      </AdminShell>
    </AuthGuard>
  );
}
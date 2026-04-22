import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { MonitoringPanel } from '../../components/MonitoringPanel';

export default function MonitoringPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <MonitoringPanel />
      </AdminShell>
    </AuthGuard>
  );
}
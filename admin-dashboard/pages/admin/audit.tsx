import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { AuditPanel } from '../../components/AuditPanel';

export default function AuditPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <AuditPanel />
      </AdminShell>
    </AuthGuard>
  );
}
import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { SettingsPanel } from '../../components/SettingsPanel';
import { useAuthContext } from '../../contexts/AuthContext';

function SettingsModule() {
  const { capabilities } = useAuthContext();
  const canWrite = capabilities.includes('admin.write.*') || capabilities.includes('admin.settings.write');
  return <SettingsPanel canWrite={canWrite} />;
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <SettingsModule />
      </AdminShell>
    </AuthGuard>
  );
}
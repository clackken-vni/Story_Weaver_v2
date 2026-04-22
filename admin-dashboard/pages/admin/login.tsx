import { useAuthContext } from '../../contexts/AuthContext';
import LoginPage from '../../components/LoginPage';

function LoginContent() {
  const { handleLoginSuccess, authNotice } = useAuthContext();
  return <LoginPage onLoginSuccess={handleLoginSuccess} notice={authNotice} />;
}

export default function AdminLoginPage() {
  return <LoginContent />;
}
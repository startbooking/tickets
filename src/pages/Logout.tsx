import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    localStorage.removeItem('userSession');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-medium">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Cerrando sesión...
    </div>
  );
};

export default Logout;

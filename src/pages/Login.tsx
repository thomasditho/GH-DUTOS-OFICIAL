import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../services/api';
import { LogIn } from 'lucide-react';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 shadow-2xl border-t-8 border-[#3A8D8F] rounded-none">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <p className="text-[#6B7280] text-[10px] uppercase tracking-[0.3em] font-bold">Painel de Gestão de Ativos</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-medium rounded-none">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">E-mail Corporativo</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-0 focus:border-[#0A192F] transition-all rounded-none"
                placeholder="exemplo@ghdutos.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Senha de Acesso</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-0 focus:border-[#0A192F] transition-all rounded-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A192F] text-white py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#112240] transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-none"
            >
              {loading ? 'Autenticando...' : (
                <>
                  Entrar no Sistema
                  <LogIn size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-[#E5E7EB] text-center">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest leading-relaxed">
              Acesso restrito a funcionários autorizados.<br />
              Em caso de perda, contate o administrador.
            </p>
          </div>
        </div>
        <p className="text-center text-white/20 text-[9px] mt-8 uppercase tracking-[0.3em]">
          &copy; 2026 GH DUTOS - Tecnologia em Manutenção Industrial
        </p>
      </div>
    </div>
  );
};

export default Login;

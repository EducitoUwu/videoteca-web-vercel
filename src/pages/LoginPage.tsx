import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import loginService from '../services/login';
import { AuthContext } from '../contexts/AuthProvider';
import { LoginCredentials, LoginResponse } from '../types/login';
import { Button } from '../components/ui/button';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response: LoginResponse = await loginService.login({ email, password } as LoginCredentials);
      const { user, accesToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accesToken);
      localStorage.setItem('refreshToken', refreshToken);
      login(user);
      navigate('/select');
    } catch (err) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xs mx-auto mt-20">
      <h1 className="text-xl font-bold">Iniciar sesión</h1>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <span className="text-red-500">{error}</span>}
      <Button type="submit">Ingresar</Button>
    </form>
  );
};

export default LoginPage;

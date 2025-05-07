import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import loginService from '../services/login';
import { LoginCredentials, LoginResponse } from '../types/login';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-300 to-blue-100 relative overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-300 opacity-50 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-200 opacity-30 blur-2xl"></div>

      <Card className="relative w-full max-w-md shadow-2xl border border-blue-300 bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-center text-blue-800 text-2xl font-bold">
            Bienvenido
          </CardTitle>
          <p className="text-center text-blue-600 text-sm">
            Por favor, inicia sesión para continuar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <Label htmlFor="email" className="text-blue-700">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-blue-300 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-blue-700">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-blue-300 focus:ring-blue-500"
              />
            </div>
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300"
            >
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

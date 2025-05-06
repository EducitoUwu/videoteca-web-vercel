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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <Card className="w-full max-w-md shadow-lg border-blue-200 border">
        <CardHeader>
          <CardTitle className="text-center text-blue-800">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

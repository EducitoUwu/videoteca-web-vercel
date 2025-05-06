import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const ManualListPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Manuales disponibles</h1>
      <h1 className="text-lg font-bold mb-4">lOGICA AQUI</h1>
      {/* Aquí iría la lista de manuales */}
      {user?.role === 'admin' && (
        <Button onClick={() => navigate('/upload-manual')} className="mb-4">
          Subir nuevo manual
        </Button>
      )}
    </div>
  );
};

export default ManualListPage;
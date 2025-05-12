import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import { Button } from "@/components/ui/button";
import ManualList from "@/components/manualBuilder/ManualList";

const ManualListPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Manuales disponibles</h1>
      <ManualList onSelect={(manualId) => {/* podrías navegar a un visor si lo deseas */}} />
      {user?.role === 'admin' && (
        <Button onClick={() => navigate('/upload-manual')} className="mb-4">
          Subir nuevo manual
        </Button>
      )}
    </div>
  );
};

export default ManualListPage;
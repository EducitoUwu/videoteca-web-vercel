import { useNavigate } from 'react-router-dom';

const SelectionPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center mt-20 gap-4">
      <h1 className="text-xl font-semibold">¿Qué deseas visualizar?</h1>
      <button onClick={() => navigate('/manuals')}>Ver manuales</button>
      <button onClick={() => navigate('/videos')}>Ver videos</button>
    </div>
  );
};

export default SelectionPage;
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const SelectionPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center mt-20 gap-6">
      <h1 className="text-2xl font-semibold">¿Qué deseas visualizar?</h1>
      <Button onClick={() => navigate('/manuals')}>Ver manuales</Button>
      <Button onClick={() => navigate('/videos')}>Ver videos</Button>
    </div>
  );
};

export default SelectionPage;
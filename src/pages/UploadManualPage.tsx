import ManualBuilder from "@/components/manualBuilder/ManualBuilder";
import { useSearchParams } from "react-router-dom";

const UploadManualPage = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  return <ManualBuilder editId={editId} />;
};

export default UploadManualPage;

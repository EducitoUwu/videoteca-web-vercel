import ManualList from "@/components/manualBuilder/ManualList";

const ManualListPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Manuales disponibles</h1>
      <ManualList />
    </div>
  );
};

export default ManualListPage;

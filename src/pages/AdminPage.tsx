
import PageHeader from '../layout/PageHeader';
import FileImporter from '../components/admin/FileImporter';
import ReadmeViewer from '../components/admin/ReadmeViewer';

export default function AdminPage() {
  return (
    <>
      <PageHeader 
        title="Panel de Administración" 
        subtitle="Herramientas para la gestión e importación de datos históricos y torneos."
        tournament_banner_url="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
      />
      
      <div className="space-y-24 px-4 sm:px-8 mt-12 pb-24">
        <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-zinc-800/50 shadow-2xl">
          <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
              📦
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-tighter text-2xl">Importador de Archivos</h3>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">JSON / CSV Data Processor</p>
            </div>
          </div>
          <FileImporter />
        </div>
        <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-zinc-800/50 shadow-2xl">
          <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
              📝
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-tighter text-2xl">Notas del Desarrollador</h3>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Estado Actual del Proyecto</p>
            </div>
          </div>
          <ReadmeViewer />
        </div>
      </div>
    </>
  );
}

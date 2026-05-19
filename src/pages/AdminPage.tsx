
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageBanner from '../layout/PageBanner';
import PageContent from '../layout/PageContent';
import FileImporter from '../components/admin/FileImporter';
import ReadmeViewer from '../components/admin/ReadmeViewer';
import ControlPanel from '../components/admin/ControlPanel';
import { useAuth } from '../functions/auth';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.user_plan !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.user_plan !== 'admin') return null;

  return (
    <>
      <PageBanner title="Administración" />
      <PageContent maxWidth="1600">
        <div className="flex flex-col gap-10">
          <ControlPanel />
          <FileImporter />
          <ReadmeViewer />
        </div>
      </PageContent>
    </>
  );
}

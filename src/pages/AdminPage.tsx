
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContent from '../layout/PageContent';
import FileImporter from '../components/admin/FileImporter';
import ReadmeViewer from '../components/admin/ReadmeViewer';
import ControlPanel from '../components/admin/ControlPanel';
import MatchBlacklist from '../components/admin/MatchBlacklist';
import { useAuth } from '../functions/auth';

export default function AdminPage() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && (!user || user.user_plan !== 'admin')) {
      navigate('/', { replace: true });
    }
  }, [user, initialized, navigate]);

  if (!initialized || !user || user.user_plan !== 'admin') return null;

  return (
    <PageContent maxWidth="1600">
      <div className="flex flex-col gap-10">
        <ControlPanel />
        <MatchBlacklist />
        <FileImporter />
        <ReadmeViewer />
      </div>
    </PageContent>
  );
}

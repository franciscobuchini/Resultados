
import PageBanner from '../layout/PageBanner';
import PageContent from '../layout/PageContent';
import FileImporter from '../components/admin/FileImporter';
import ReadmeViewer from '../components/admin/ReadmeViewer';
import ControlPanel from '../components/admin/ControlPanel';

export default function AdminPage() {
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

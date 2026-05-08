
import PageBanner from '../layout/PageBanner';
import FileImporter from '../components/admin/FileImporter';
import ReadmeViewer from '../components/admin/ReadmeViewer';

export default function AdminPage() {
  return (
    <>
      <PageBanner title="Administración" />
      <div>
        <FileImporter />
        <ReadmeViewer />
      </div>
    </>
  );
}

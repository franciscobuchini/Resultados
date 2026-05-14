
import PageBanner from '../layout/PageBanner';
import PageContent from '../layout/PageContent';
import FileImporter from '../components/admin/FileImporter';
import ReadmeViewer from '../components/admin/ReadmeViewer';

export default function AdminPage() {
  return (
    <>
      <PageBanner title="Administración" />
      <PageContent maxWidth="1600">
        <FileImporter />
        <ReadmeViewer />
      </PageContent>
    </>
  );
}

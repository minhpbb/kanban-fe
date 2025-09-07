import MainLayout from '@/components/layout/MainLayout';
import ProjectDetail from '@/components/projects/ProjectDetail';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const projectId = parseInt(id);

  return (
    <MainLayout
      title="Project Details"
      subtitle="Manage your project"
      showTabs={false}
      showNewButton={false}
    >
      <ProjectDetail projectId={projectId} />
    </MainLayout>
  );
}

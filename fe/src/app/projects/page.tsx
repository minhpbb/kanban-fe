import MainLayout from '@/components/layout/MainLayout';
import ProjectsPage from '@/components/projects/ProjectsPage';

export default function Projects() {
  return (
    <MainLayout
      title="Projects"
      subtitle="Manage all your projects"
      showTabs={false}
      showNewButton={false}
    >
      <ProjectsPage />
    </MainLayout>
  );
}

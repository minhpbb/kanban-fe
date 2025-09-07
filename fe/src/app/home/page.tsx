import MainLayout from '@/components/layout/MainLayout';
import HomePage from '@/components/dashboard/HomePage';

export default function Home() {
  return (
    <MainLayout
      title="Home"
      subtitle="Monitor all of your projects and tasks here"
      showTabs={false}
      showNewButton={false}
    >
      <HomePage />
    </MainLayout>
  );
}

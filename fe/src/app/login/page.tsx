import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Kanban Board</h1>
          <p className="text-gray-600">Manage your projects efficiently</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
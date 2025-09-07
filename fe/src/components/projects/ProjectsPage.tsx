'use client';

import { Project } from '@/types/project';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProjects, deleteProject } from '@/store/slices/projectSlice';
import ProjectCard from './ProjectCard';
import CreateProjectForm from './CreateProjectForm';
import { useToast } from '@/hooks';

const ProjectsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, error } = useAppSelector((state) => state.projects);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    dispatch(fetchProjects({}));
  }, [dispatch]);

  const handleCreateProject = () => {
    setIsCreateModalVisible(true);
  };

  const handleEditProject = (project: Project) => {
    // Navigate to project detail page for editing
    window.location.href = `/projects/${project.id}`;
  };

  const handleDeleteProject = async (projectId: number) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteProject(projectId)).unwrap();
          success('Project deleted successfully');
        } catch (error) {
          showError(error as string);
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setIsCreateModalVisible(false);
    dispatch(fetchProjects({})); // Refresh projects list
  };


  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Projects</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => dispatch(fetchProjects({}))}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Add New Project Card */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group min-h-[240px]"
          onClick={handleCreateProject}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <PlusOutlined className="text-xl text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1 group-hover:text-blue-700">Add New Project</h3>
          <p className="text-xs text-gray-500 text-center group-hover:text-blue-600">
            Create a new project
          </p>
        </div>

        {/* Existing Projects */}
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        ))}
      </div>

      {/* Create Project Modal */}
      <Modal
        title="Create New Project"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CreateProjectForm
          onSuccess={handleCreateSuccess}
        />
      </Modal>
    </div>
  );
};

export default ProjectsPage;

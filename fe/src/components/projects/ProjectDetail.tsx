'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Spin, Alert } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProjectById } from '@/store/slices/projectSlice';
import ProjectOverview from './ProjectOverview';
import ProjectMembers from './ProjectMembers';
import ProjectTaskManagement from './ProjectTaskManagement';

interface ProjectDetailProps {
  projectId: number;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { currentProject, isLoading, error } = useAppSelector((state) => state.projects);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Fetch project details when component mounts
    dispatch(fetchProjectById(projectId));
  }, [dispatch, projectId]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-96">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Alert
          message="Error Loading Project"
          description={error}
          type="error"
          showIcon
          action={
            <button 
              onClick={() => dispatch(fetchProjectById(projectId))}
              className="text-blue-500 hover:text-blue-600"
            >
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-6 lg:p-8">
        <Alert
          message="Project Not Found"
          description="The project you're looking for doesn't exist or has been deleted."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="project-detail-tabs"
        items={[
          {
            key: 'overview',
            label: <span className="px-4 py-2 font-medium">Overview</span>,
            children: <ProjectOverview project={currentProject} />
          },
          {
            key: 'members',
            label: <span className="px-4 py-2 font-medium">Members</span>,
            children: <ProjectMembers projectId={projectId} />
          },
          {
            key: 'tasks',
            label: <span className="px-4 py-2 font-medium">Task Management</span>,
            children: <ProjectTaskManagement projectId={projectId} />
          }
        ]}
      />
    </div>
  );
};

export default ProjectDetail;
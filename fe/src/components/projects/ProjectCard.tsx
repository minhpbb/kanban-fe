'use client';

import { Project } from '@/types/api';
import { CalendarOutlined, DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import React from 'react';
import { formatDate, formatDateRange } from '@/utils/dateUtils';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: number) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const router = useRouter();

  const getProjectIcon = (projectName: string) => {
    if (projectName.includes('Mobile')) return 'M';
    if (projectName.includes('Website')) return 'W';
    return 'P';
  };

  const getProjectColor = (projectName: string) => {
    if (projectName.includes('Mobile')) return 'bg-blue-500';
    if (projectName.includes('Website')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'archived': return 'orange';
      case 'deleted': return 'red';
      default: return 'default';
    }
  };

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit project',
      onClick: () => onEdit(project)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete project',
      danger: true,
      onClick: () => onDelete(project.id)
    }
  ];

  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm hover:scale-[1.02] h-full"
      onClick={handleCardClick}
      styles={{ body: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <div className="space-y-3 flex-1 flex flex-col">
        {/* Project Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={`w-12 h-12 ${getProjectColor(project.name)} rounded-lg flex items-center justify-center shadow-md flex-shrink-0`}>
              <span className="text-white font-bold text-lg">{getProjectIcon(project.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base truncate mb-1">{project.name}</h3>
              <Tag color={getStatusColor(project.status)} className="text-xs">
                {project.status.toUpperCase()}
              </Tag>
            </div>
          </div>
          
          {/* Three dots menu */}
          <Dropdown 
            menu={{ items: menuItems }} 
            trigger={['click']} 
            placement="bottomRight"
            overlayStyle={{ zIndex: 1050 }}
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              size="small"
            />
          </Dropdown>
        </div>

        {/* Project Description */}
        {project.description && (
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed flex-1">{project.description}</p>
        )}

        {/* Project Dates */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 rounded-md p-2">
            <CalendarOutlined className="text-blue-500" />
            <span className="truncate">
              {formatDateRange(project.startDate, project.endDate)}
            </span>
          </div>
        )}

        {/* Project Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Active</span>
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(project.createdAt)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;

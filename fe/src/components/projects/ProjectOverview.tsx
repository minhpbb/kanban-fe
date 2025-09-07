'use client';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tag, Button, Statistic, Row, Col, Modal, DatePicker, Spin, Alert } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  CheckSquareOutlined
} from '@ant-design/icons';
import { Project } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/store';
import { getProjectOverview, getProjectActivities } from '@/store/slices/projectSlice';
import { formatDateRange, formatDate } from '@/utils/dateUtils';

interface ProjectOverviewProps {
  project: Project;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ project }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.projects);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [overviewData, setOverviewData] = useState<{
    statistics?: {
      totalTasks: number;
      completedTasks: number;
      totalMembers: number;
      overdueTasks: number;
    };
  } | null>(null);
  const [activities, setActivities] = useState<Array<{
    id: number;
    description: string;
    userName: string;
    userAvatar?: string;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    // Fetch project overview data
    const fetchOverviewData = async () => {
      try {
        const overview = await dispatch(getProjectOverview(project.id)).unwrap();
        setOverviewData(overview);
      } catch (error) {
        console.error('Failed to fetch project overview:', error);
      }
    };

    const fetchActivities = async () => {
      try {
        const activitiesData = await dispatch(getProjectActivities({ 
          projectId: project.id, 
          limit: 10 
        })).unwrap();
        setActivities(activitiesData.activities || []);
      } catch (error) {
        console.error('Failed to fetch project activities:', error);
      }
    };

    fetchOverviewData();
    fetchActivities();
  }, [dispatch, project.id]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Project Overview"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  const statistics = overviewData?.statistics || {
    totalTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    overdueTasks: 0
  };

  return (
    <div className="space-y-12">
      {/* Project Info Card */}
      <Card 
        title="Project Information" 
        className="shadow-sm border-0"
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div className="flex items-start space-x-6">
          <div className={`w-20 h-20 ${getProjectColor(project.name)} rounded-2xl flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-3xl">{getProjectIcon(project.name)}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{project.name}</h2>
            <Tag color={getStatusColor(project.status)} className="mb-6 text-sm px-3 py-1">
              {project.status.toUpperCase()}
            </Tag>
            {project.description && (
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">{project.description}</p>
            )}
            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-3 bg-gray-50 px-4 py-3 rounded-lg">
                <CalendarOutlined className="text-blue-500" />
                <span className="font-medium">
                  {formatDateRange(project.startDate, project.endDate)}
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-gray-50 px-4 py-3 rounded-lg">
                <UserOutlined className="text-green-500" />
                <span className="font-medium">Owner: Admin</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Statistics */}
      <Row className="mb-8 mt-8" gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow" styles={{ body: { padding: '24px' } }}>
            <Statistic
              title="Total Tasks"
              value={statistics.totalTasks}
              prefix={<CheckSquareOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow" styles={{ body: { padding: '24px' } }}>
            <Statistic
              title="Completed"
              value={statistics.completedTasks}
              prefix={<CheckSquareOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow" styles={{ body: { padding: '24px' } }}>
            <Statistic
              title="Team Members"
              value={statistics.totalMembers}
              prefix={<TeamOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1', fontSize: '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm border-0 hover:shadow-md transition-shadow" styles={{ body: { padding: '24px' } }}>
            <Statistic
              title="Overdue Tasks"
              value={statistics.overdueTasks}
              prefix={<CalendarOutlined className="text-red-500" />}
              valueStyle={{ color: '#ff4d4f', fontSize: '28px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span>Recent Activities</span>
            <Button 
              type="link" 
              onClick={() => setIsActivityModalVisible(true)}
              className="text-blue-500 hover:text-blue-600"
            >
              View Details
            </Button>
          </div>
        }
        className="shadow-sm border-0"
        styles={{ body: { padding: '32px 24px' } }}
      >
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activities</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <Avatar 
                  size="default" 
                  icon={<UserOutlined />} 
                  className="bg-gray-500"
                  src={activity.userAvatar}
                />
                <div className="px-4 flex-1">
                  <p className="text-sm text-gray-700 font-medium">
                    <span className="font-semibold text-gray-900">{activity.userName}</span> {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(activity.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Activity Details Modal */}
      <Modal
        title="Activity Details"
        open={isActivityModalVisible}
        onCancel={() => setIsActivityModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-6">
            <DatePicker.RangePicker 
              placeholder={['Start Date', 'End Date']}
              className="w-full"
            />
            {/* <Button type="primary">Filter</Button> */}
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Avatar size="default" icon={<UserOutlined />} className="bg-gray-500" />
                <div className="px-4 flex-1">
                  <p className="text-sm text-gray-700 font-medium">
                    <span className="font-semibold text-gray-900">User {index + 1}</span> performed action {index + 1}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{index + 1} days ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectOverview;

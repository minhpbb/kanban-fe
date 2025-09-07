'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Card, Avatar, Tag, Button, Statistic, Row, Col, Modal, DatePicker, Spin, Alert, Select, Input } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  CheckSquareOutlined,
  FilterOutlined,
  SearchOutlined
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
  const { isLoading, error, currentProject } = useAppSelector((state) => state.projects);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [overviewData, setOverviewData] = useState<{
    statistics?: {
      totalTasks: number;
      completedTasks: number;
      totalMembers: number;
      overdueTasks: number;
    };
  } | null>(null);
  
  // Filter states
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  
  // Use Redux state for activities instead of local state
  const allActivities = currentProject?.activities || [];
  
  // Debug: Log activities data
  console.log('🔍 ProjectOverview - allActivities:', allActivities);
  console.log('🔍 ProjectOverview - currentProject:', currentProject);
  
  // Filter activities
  const filteredActivities = allActivities.filter(activity => {
    // Type filter
    if (activityTypeFilter !== 'all' && activity.type !== activityTypeFilter) {
      return false;
    }
    
    // Search filter
    if (searchFilter && !activity.description.toLowerCase().includes(searchFilter.toLowerCase()) &&
        !activity.userName.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    
    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const activityDate = new Date(activity.createdAt);
      const startDate = dateRange[0].startOf('day').toDate();
      const endDate = dateRange[1].endOf('day').toDate();
      if (activityDate < startDate || activityDate > endDate) {
        return false;
      }
    }
    
    return true;
  });

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
        console.log('🔄 Fetching activities for project:', project.id);
        const activitiesData = await dispatch(getProjectActivities({ 
          projectId: project.id, 
          limit: 10 
        })).unwrap();
        console.log('✅ Activities fetched:', activitiesData);
        // Activities will be automatically updated via Redux when SSE receives new data
      } catch (error) {
        console.error('❌ Failed to fetch project activities:', error);
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

  // const getActivityIcon = (type: string) => {
  //   switch (type) {
  //     case 'task_moved': return '🔄';
  //     case 'task_created': return '➕';
  //     case 'task_updated': return '✏️';
  //     case 'task_deleted': return '🗑️';
  //     case 'member_added': return '👥';
  //     case 'member_removed': return '👋';
  //     case 'project_created': return '📁';
  //     case 'project_updated': return '📝';
  //     default: return '📋';
  //   }
  // };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_moved': return '#1890ff';
      case 'task_created': return '#52c41a';
      case 'task_updated': return '#faad14';
      case 'task_deleted': return '#ff4d4f';
      case 'member_added': return '#722ed1';
      case 'member_removed': return '#f5222d';
      case 'project_created': return '#13c2c2';
      case 'project_updated': return '#eb2f96';
      default: return '#8c8c8c';
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
          {allActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activities</p>
            </div>
          ) : (
            allActivities.slice(0, 5).map((activity) => (
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
                  <div className="flex items-center space-x-2 mt-1">
                    <Tag color={getActivityColor(activity.type)}>
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </Tag>
                    <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                  </div>
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
        width={1000}
      >
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <FilterOutlined className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <Select
              value={activityTypeFilter}
              onChange={setActivityTypeFilter}
              style={{ width: 150 }}
              size="small"
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="task_moved">Task Moved</Select.Option>
              <Select.Option value="member_added">Member Added</Select.Option>
              <Select.Option value="member_removed">Member Removed</Select.Option>
              <Select.Option value="task_created">Task Created</Select.Option>
              <Select.Option value="task_updated">Task Updated</Select.Option>
              <Select.Option value="task_deleted">Task Deleted</Select.Option>
            </Select>
            
            <Input
              placeholder="Search activities..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              size="small"
            />
            
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              size="small"
              placeholder={['Start Date', 'End Date']}
            />
            
            <Button 
              size="small" 
              onClick={() => {
                setActivityTypeFilter('all');
                setSearchFilter('');
                setDateRange(null);
              }}
            >
              Clear
            </Button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{allActivities.length === 0 ? 'No activities found' : 'No activities match your filters'}</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />} 
                    className="bg-gray-500"
                    src={activity.userAvatar}
                  />
                  <div className="px-4 flex-1">
                    <p className="text-sm text-gray-700 font-medium">
                      <span className="font-semibold text-gray-900">{activity.userName}</span> {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Tag color={getActivityColor(activity.type)}>
                        {activity.type.replace('_', ' ').toUpperCase()}
                      </Tag>
                      <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectOverview;

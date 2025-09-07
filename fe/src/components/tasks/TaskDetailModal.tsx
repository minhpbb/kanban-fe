'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Descriptions, 
  Tag, 
  Button, 
  Tabs,
  Typography,
  Card
} from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  PaperClipOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Task, KanbanColumn } from '@/types/api';
import { User } from '@/types/user';
import { formatDate } from '@/utils/dateUtils';
import { getTaskStatus, getStatusColor, getStatusText } from '@/utils/taskUtils';
import TaskCommentSection from './TaskCommentSection';
import AssigneeDisplay from '@/components/common/AssigneeDisplay';
import UserAvatar from '@/components/common/UserAvatar';
import { userService } from '@/services/userService';

const { Title } = Typography;

interface TaskDetailModalProps {
  task: Task | null;
  columns: KanbanColumn[];
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  columns,
  visible,
  onClose,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [createdByUser, setCreatedByUser] = useState<User | null>(null);

  useEffect(() => {
    if (task?.createdById) {
      const fetchCreatedByUser = async () => {
        try {
          const user = await userService.getUserById(task.createdById);
          setCreatedByUser(user);
        } catch (error) {
          console.error('Failed to fetch created by user:', error);
        }
      };
      fetchCreatedByUser();
    }
  }, [task?.createdById]);

  if (!task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      case 'urgent': return 'purple';
      default: return 'default';
    }
  };

  const getStatus = () => {
    return getTaskStatus(task, columns);
  };


  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <Title level={4} className="mb-0">
            {task.title}
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="task-detail-modal"
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'details',
            label: (
              <span>
                <UserOutlined />
                <span className="ml-2">Details</span>
              </span>
            ),
            children: (
              <div className="space-y-6">
                {/* Task Description */}
                {task.description && (
                  <Card size="small" title="Description">
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {task.description}
                    </div>
                  </Card>
                )}

                {/* Task Information */}
                <Descriptions 
                  column={2} 
                  size="small"
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                >
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(getStatus())}>
                      {getStatusText(getStatus())}
                    </Tag>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Priority">
                    <Tag color={getPriorityColor(task.priority)}>
                      {task.priority.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Assignees">
                    <AssigneeDisplay 
                      assigneeIds={task.assigneeIds}
                      maxVisible={3}
                      size="default"
                    />
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Created By">
                    <div className="flex items-center space-x-2">
                      <UserAvatar userId={task.createdById} size="small" />
                      <span className="text-sm">
                        {createdByUser ? (createdByUser.fullName || createdByUser.username || `User ${task.createdById}`) : `User ${task.createdById}`}
                      </span>
                    </div>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Due Date">
                    <div className="flex items-center space-x-1">
                      <CalendarOutlined className="text-gray-400" />
                      <span className={task.dueDate && new Date(task.dueDate) < new Date() && getStatus() !== 'done' ? 'text-red-500' : 'text-gray-600'}>
                        {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                      </span>
                    </div>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Created">
                    <div className="flex items-center space-x-1">
                      <CalendarOutlined className="text-gray-400" />
                      <span className="text-gray-600">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Time Tracking">
                    <div className="flex items-center space-x-1">
                      <ClockCircleOutlined className="text-gray-400" />
                      <span className="text-gray-600">
                        {task.timeTracking?.actualHours || 0}h / {task.timeTracking?.estimatedHours || 0}h
                      </span>
                    </div>
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="Last Updated">
                    <div className="flex items-center space-x-1">
                      <CalendarOutlined className="text-gray-400" />
                      <span className="text-gray-600">
                        {formatDate(task.updatedAt)}
                      </span>
                    </div>
                  </Descriptions.Item>
                </Descriptions>

                {/* Labels */}
                {task.labels && task.labels.length > 0 && (
                  <Card size="small" title="Labels">
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map((label, index) => (
                        <Tag key={index} color="blue">
                          {label}
                        </Tag>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Attachments */}
                {task.attachments && task.attachments.length > 0 && (
                  <Card size="small" title="Attachments">
                    <div className="space-y-2">
                      {task.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <PaperClipOutlined className="text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{attachment.filename}</div>
                            <div className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(1)} KB • {attachment.type}
                            </div>
                          </div>
                          <Button type="link" size="small">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )
          },
          {
            key: 'comments',
            label: (
              <span>
                <MessageOutlined />
                <span className="ml-2">Comments</span>
                {task.comments && task.comments.length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                    {task.comments.length}
                  </span>
                )}
              </span>
            ),
            children: (
              <TaskCommentSection
                taskId={task.id}
                loading={loading}
              />
            )
          }
        ]}
      />
    </Modal>
  );
};

export default TaskDetailModal;

'use client';

import React from 'react';
import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { 
  CalendarOutlined, 
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Task } from '@/types/task';
import { KanbanColumn } from '@/types/kanban-board';
import { formatDate } from '@/utils/dateUtils';
import { getTaskStatus, getStatusColor, getStatusText } from '@/utils/taskUtils';
import { UserAvatar } from '@/components/common';

interface TaskTableProps {
  tasks: Task[];
  columns: KanbanColumn[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onView?: (task: Task) => void;
  showProject?: boolean;
  showAssignee?: boolean;
  loading?: boolean;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  columns,
  onEdit,
  onDelete,
  onView,
  showProject = true,
  showAssignee = true,
  loading = false
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };


  const tableColumns = [
    {
      title: 'Task',
      key: 'task',
      render: (record: Task) => (
        <div className="flex flex-col">
          <div className="font-medium text-gray-900 mb-1">{record.title}</div>
          {record.description && (
            <div className="text-sm text-gray-500 line-clamp-2">
              {record.description}
            </div>
          )}
          {record.labels && record.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {record.labels.map((label, index) => (
                <Tag key={index} color="blue">
                  {label}
                </Tag>
              ))}
            </div>
          )}
        </div>
      ),
    },
    ...(showProject ? [{
      title: 'Project',
      key: 'project',
      render: (record: Task) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {record.project?.name?.charAt(0) || 'P'}
            </span>
          </div>
          <span className="text-sm font-medium">{record.project?.name || 'Unknown'}</span>
        </div>
      ),
    }] : []),
    ...(showAssignee ? [{
      title: 'Assignee',
      key: 'assignee',
      render: (record: Task) => (
        <div className="flex items-center space-x-2">
          <UserAvatar user={record.assignee} size="small" />
          <span className="text-sm">
            {record.assignee?.fullName || 'Unassigned'}
          </span>
        </div>
      ),
    }] : []),
    {
      title: 'Priority',
      key: 'priority',
      render: (record: Task) => (
        <Tag color={getPriorityColor(record.priority)}>
          {record.priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Task) => {
        const status = getTaskStatus(record, columns);
        return (
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
        );
      },
    },
    {
      title: 'Due Date',
      key: 'dueDate',
      render: (record: Task) => (
        <div className="flex items-center space-x-1 text-sm">
          <CalendarOutlined className="text-gray-400" />
          <span className={record.dueDate && new Date(record.dueDate) < new Date() && getTaskStatus(record, columns) !== 'done' ? 'text-red-500' : 'text-gray-600'}>
            {record.dueDate ? formatDate(record.dueDate) : 'No due date'}
          </span>
        </div>
      ),
    },
    {
      title: 'Time',
      key: 'time',
      render: (record: Task) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <ClockCircleOutlined />
          <span>
            {record.timeTracking?.actualHours || 0}h / {record.timeTracking?.estimatedHours || 0}h
          </span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Task) => (
        <Space>
          {onView && (
            <Tooltip title="View Details">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                size="small"
                onClick={() => onView(record)}
              />
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Edit Task">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                size="small"
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete Task">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small" 
                danger
                onClick={() => onDelete(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={tableColumns}
      dataSource={tasks}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`,
      }}
      className="modern-table"
      scroll={{ x: 800 }}
    />
  );
};

export default TaskTable;

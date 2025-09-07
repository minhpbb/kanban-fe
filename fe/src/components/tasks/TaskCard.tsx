'use client';

import AssigneeDisplay from '@/components/common/AssigneeDisplay';
import { KanbanColumn, Task } from '@/types/api';
import { formatDate } from '@/utils/dateUtils';
import { getTaskStatus } from '@/utils/taskUtils';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Button, Card, Tag, Tooltip } from 'antd';
import React from 'react';

interface TaskCardProps {
  task: Task;
  columns: KanbanColumn[];
  onView?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  showProject?: boolean;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  columns,
  onView,
  onEdit,
  onDelete,
  showProject = true,
  onDragStart
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      case 'urgent': return 'purple';
      default: return 'default';
    }
  };

  return (
    <Card
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      size="small"
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      styles={{ body: { padding: '12px' } }}
    >
      <div className="space-y-2">
        {/* Task Title */}
        <div className="font-medium text-gray-900 text-sm line-clamp-2">
          {task.title}
        </div>

        {/* Task Description */}
        {task.description && (
          <div className="text-xs text-gray-500 line-clamp-2">
            {task.description}
          </div>
        )}

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 2).map((label, index) => (
              <Tag key={index} color="blue">
                {label}
              </Tag>
            ))}
            {task.labels.length > 2 && (
              <Tag color="default">
                +{task.labels.length - 2}
              </Tag>
            )}
          </div>
        )}

        {/* Project */}
        {showProject && task.project && (
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {task.project.name.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-gray-500 truncate">
              {task.project.name}
            </span>
          </div>
        )}

        {/* Priority */}
        <div className="flex items-center justify-between">
          <Tag color={getPriorityColor(task.priority)}>
            {task.priority.toUpperCase()}
          </Tag>
        </div>

        {/* Assignees and Due Date */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <AssigneeDisplay 
            assigneeIds={task.assigneeIds}
            maxVisible={2}
            size="small"
          />
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <CalendarOutlined />
              <span className={new Date(task.dueDate) < new Date() && getTaskStatus(task, columns) !== 'done' ? 'text-red-500' : ''}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          )}
        </div>

        {/* Time Tracking */}
        {(task.timeTracking?.estimatedHours || task.timeTracking?.actualHours) && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <ClockCircleOutlined />
            <span>
              {task.timeTracking?.actualHours || 0}h / {task.timeTracking?.estimatedHours || 0}h
            </span>
          </div>
        )}

        {/* Comments Count */}
        {task.comments && task.comments.length > 0 && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <MessageOutlined />
            <span>{task.comments.length}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-1 pt-1 border-t border-gray-100">
          {onView && (
            <Tooltip title="View Details">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                size="small"
                onClick={() => onView(task)}
              />
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Edit Task">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                size="small"
                onClick={() => onEdit(task)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete Task">
              <Button 
                type="text" 
                danger
                icon={<DeleteOutlined />} 
                size="small"
                onClick={() => onDelete(task.id)}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;

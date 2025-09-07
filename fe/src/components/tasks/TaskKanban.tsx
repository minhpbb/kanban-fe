'use client';

import { Task } from '@/types/task';
import { KanbanColumn, ColumnType } from '@/types/kanban-board';
import {
  PlusOutlined,
  SettingOutlined,
  LockOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Badge, Button, Tooltip, Modal, message } from 'antd';
import React, { useState } from 'react';
import TaskCard from './TaskCard';

interface TaskKanbanProps {
  tasks: Task[];
  columns: KanbanColumn[];
  onView?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onMoveTask?: (taskId: number, newColumnId: number) => void;
  onAddTask?: (columnId: number) => void;
  onAddColumn?: () => void;
  onEditColumn?: (column: KanbanColumn) => void;
  onDeleteColumn?: (columnId: number) => void;
  showProject?: boolean;
  loading?: boolean;
}

const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  columns,
  onView,
  onEdit,
  onDelete,
  onMoveTask,
  onAddTask,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  showProject = true,
  loading = false
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Suppress unused variable warning
  console.log(loading);

  const getTasksByColumn = (columnId: number) => {
    return tasks.filter(task => task.columnId === columnId);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: number) => {
    e.preventDefault();
    if (draggedTask && onMoveTask && draggedTask.columnId !== columnId) {
      onMoveTask(draggedTask.id, columnId);
    }
    setDraggedTask(null);
  };

  const handleDeleteColumn = (column: KanbanColumn) => {
    if (column.type === ColumnType.SYSTEM) {
      message.warning('System columns cannot be deleted');
      return;
    }

    Modal.confirm({
      title: 'Delete Column',
      content: `Are you sure you want to delete the column "${column.name}"? All tasks in this column will also be deleted.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        if (onDeleteColumn) {
          onDeleteColumn(column.id);
        }
      },
    });
  };


  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = getTasksByColumn(column.id);
        
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className={`rounded-lg p-3 mb-3 ${column.type === ColumnType.SYSTEM ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold ${column.type === ColumnType.SYSTEM ? 'text-blue-900' : 'text-gray-900'}`}>
                    {column.name}
                  </h3>
                  {column.type === ColumnType.SYSTEM && (
                    <Tooltip title="System column (cannot be deleted)">
                      <LockOutlined className="text-blue-500 text-xs" />
                    </Tooltip>
                  )}
                  <Badge 
                    count={columnTasks.length} 
                    style={{ backgroundColor: column.type === ColumnType.SYSTEM ? '#1890ff' : '#52c41a' }}
                  />
                </div>
                            <div className="flex items-center space-x-1">
                              {onEditColumn && column.type !== ColumnType.SYSTEM && (
                                <Tooltip title="Edit column">
                                  <Button
                                    type="text"
                                    icon={<SettingOutlined />}
                                    size="small"
                                    onClick={() => onEditColumn(column)}
                                  />
                                </Tooltip>
                              )}
                              {onDeleteColumn && column.type !== ColumnType.SYSTEM && (
                                <Tooltip title="Delete column">
                                  <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    danger
                                    onClick={() => handleDeleteColumn(column)}
                                  />
                                </Tooltip>
                              )}
                              {onAddTask && (
                                <Tooltip title="Add task">
                                  <Button
                                    type="text"
                                    icon={<PlusOutlined />}
                                    size="small"
                                    onClick={() => onAddTask(column.id)}
                                  />
                                </Tooltip>
                              )}
                            </div>
              </div>
              {column.description && (
                <p className="text-xs text-gray-500 mt-1">{column.description}</p>
              )}
              {column.isWipLimit && column.wipSettings?.limit && (
                <div className="text-xs text-gray-400 mt-1">
                  WIP Limit: {columnTasks.length}/{column.wipSettings.limit}
                  {column.wipSettings.warningThreshold && columnTasks.length >= column.wipSettings.warningThreshold && (
                    <span className="text-orange-500 ml-1">⚠️</span>
                  )}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="min-h-96">
              {columnTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  columns={columns}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  showProject={showProject}
                  onDragStart={handleDragStart}
                />
              ))}
              
              {/* Empty State */}
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-sm">No tasks</div>
                  {onAddTask && (
                    <Button
                      type="dashed"
                      size="small"
                      className="mt-2"
                      onClick={() => onAddTask(column.id)}
                    >
                      Add Task
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Add Column Button */}
      {onAddColumn && (
        <div className="flex-shrink-0 w-80">
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group min-h-[200px]">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
              <PlusOutlined className="text-lg text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1 group-hover:text-blue-700">Add Column</h3>
            <p className="text-xs text-gray-500 text-center group-hover:text-blue-600">
              Create a new column
            </p>
            <Button
              type="primary"
              size="small"
              className="mt-2"
              onClick={onAddColumn}
            >
              Add Column
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskKanban;

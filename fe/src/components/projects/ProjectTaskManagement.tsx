'use client';

import ColumnForm from '@/components/tasks/ColumnForm';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import TaskForm from '@/components/tasks/TaskForm';
import TaskKanban from '@/components/tasks/TaskKanban';
import { useAppDispatch, useAppSelector } from '@/store';
import { createColumn as createKanbanColumn, deleteColumn as deleteKanbanColumn, fetchBoardColumns, fetchProjectBoards, updateColumn as updateKanbanColumn } from '@/store/slices/kanbanSlice';
import { createTask, deleteTask, fetchTasks, moveTask, updateTask } from '@/store/slices/taskSlice';
import { ColumnColor, ColumnType, KanbanColumn } from '@/types/kanban-board';
import { Task } from '@/types/task';
import { getTaskStats } from '@/utils/taskUtils';
import {
  PlusOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, message, Spin } from 'antd';
import React, { useEffect, useState } from 'react';

interface ProjectTaskManagementProps {
  projectId?: number;
}

const ProjectTaskManagement: React.FC<ProjectTaskManagementProps> = ({
  projectId = 1
}) => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading, error } = useAppSelector((state) => state.tasks);
  const { boards, currentBoard, columns } = useAppSelector((state) => state.kanban);

  // Debug logging
  console.log('ProjectTaskManagement state:', {
    projectId,
    tasks: tasks.length,
    columns: columns.length,
    boards: boards.length,
    currentBoard,
    isLoading,
    error,
    tasksData: tasks,
    columnsData: columns
  });

  // const [viewMode, setViewMode] = useState<'kanban'>('kanban');
  const [isTaskFormVisible, setIsTaskFormVisible] = useState(false);
  const [isColumnFormVisible, setIsColumnFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);

  useEffect(() => {
    console.log('ProjectTaskManagement: Fetching boards for projectId:', projectId);
    // Fetch project boards first
    dispatch(fetchProjectBoards(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    console.log('ProjectTaskManagement: Boards loaded:', boards.length, 'Current board:', currentBoard);
    // When boards are loaded, set current board and fetch tasks and columns
    if (boards.length > 0 && !currentBoard) {
      const firstBoard = boards[0];
      console.log('ProjectTaskManagement: Setting current board and fetching columns and tasks for board:', firstBoard.id);
      // Set current board first
      dispatch({ type: 'kanban/setCurrentBoard', payload: firstBoard });
      // Then fetch columns and tasks
      dispatch(fetchBoardColumns(firstBoard.id));
      dispatch(fetchTasks({ projectId }));
    }
  }, [dispatch, boards, currentBoard, projectId]);


  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormVisible(true);
  };

  const handleDeleteTask = async (taskId: number) => {
    console.log('Delete task clicked for taskId:', taskId);
    
    try {
      console.log('About to show confirm for task delete');
      
      // Use window.confirm since Modal.confirm is not working
      const confirmed = window.confirm('Are you sure you want to delete this task?');
      console.log('Window.confirm result for task:', confirmed);
      
      if (confirmed) {
        try {
          console.log('Confirming delete task:', taskId);
          // Optimistically remove task from Redux state
          dispatch({
            type: 'tasks/removeTaskFromList',
            payload: taskId
          });

          await dispatch(deleteTask(taskId)).unwrap();
          message.success('Task deleted successfully');
        } catch (error) {
          // Revert optimistic update on error
          dispatch(fetchTasks({ projectId }));
          message.error(error as string);
        }
      } else {
        console.log('Delete task cancelled');
      }
    } catch (error) {
      console.error('Error showing modal:', error);
      // Fallback to window.confirm
      const confirmed = window.confirm('Are you sure you want to delete this task?');
      if (confirmed) {
        try {
          // Optimistically remove task from Redux state
          dispatch({
            type: 'tasks/removeTaskFromList',
            payload: taskId
          });

          await dispatch(deleteTask(taskId)).unwrap();
          message.success('Task deleted successfully');
        } catch (error) {
          // Revert optimistic update on error
          dispatch(fetchTasks({ projectId }));
          message.error(error as string);
        }
      }
    }
  };


  const handleMoveTask = async (taskId: number, newColumnId: number) => {
    // Find the task to update
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;

    try {
      // Optimistically update the task in Redux state
      const updatedTask = { ...taskToUpdate, columnId: newColumnId };
      dispatch({
        type: 'tasks/updateTaskInList',
        payload: updatedTask
      });

      // Call API to update on server
      await dispatch(moveTask({ taskId, targetColumnId: newColumnId })).unwrap();
      message.success('Task moved successfully');
    } catch (error) {
      // Revert optimistic update on error
      dispatch({
        type: 'tasks/updateTaskInList',
        payload: taskToUpdate
      });
      message.error(error as string);
    }
  };



  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskFormVisible(true);
  };

  const handleAddColumn = () => {
    setEditingColumn(null);
    setIsColumnFormVisible(true);
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column);
    setIsColumnFormVisible(true);
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      await dispatch(deleteKanbanColumn(columnId)).unwrap();
      message.success('Column deleted successfully');
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleFormSubmit = async (values: Partial<Task>) => {
    try {
      if (editingTask) {
        // Update existing task
        const updatedTask = { ...editingTask, ...values };
        dispatch({
          type: 'tasks/updateTaskInList',
          payload: updatedTask
        });

        // Remove fields that are not allowed in UpdateTaskDto
        const updateData = { ...values } as Record<string, unknown>;
        delete updateData.estimatedHours;
        delete updateData.actualHours;
        delete updateData.projectId;
        delete updateData.boardId;
        delete updateData.id;
        delete updateData.createdById;
        delete updateData.order;
        await dispatch(updateTask({ id: editingTask.id, data: updateData })).unwrap();
        message.success('Task updated successfully');
      } else {
        // Create new task
        const taskData = {
          title: values.title || '',
          description: values.description,
          projectId,
          boardId: currentBoard?.id || boards[0]?.id || 1,
          columnId: values.columnId || columns[0]?.id || 1,
          priority: values.priority || 'medium',
          assigneeIds: values.assigneeIds,
          dueDate: values.dueDate,
          labels: values.labels,
          timeTracking: values.timeTracking,
        };
        await dispatch(createTask(taskData)).unwrap();
        message.success('Task created successfully');
      }

      setIsTaskFormVisible(false);
      setEditingTask(null);
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleColumnFormSubmit = async (values: Partial<KanbanColumn>) => {
    try {
      if (editingColumn) {
        // Update existing column
        await dispatch(updateKanbanColumn({ columnId: editingColumn.id, data: values })).unwrap();
        message.success('Column updated successfully');
      } else {
        // Create new column
        const columnData = {
          name: values.name || '',
          description: values.description,
          type: values.type || ColumnType.CUSTOM,
          color: values.color || ColumnColor.BLUE,
          order: values.order || columns.length,
          maxTasks: values.maxTasks || 0,
          isWipLimit: values.isWipLimit || false,
          wipSettings: values.wipSettings,
          rules: values.rules,
        };
        await dispatch(createKanbanColumn({ boardId: currentBoard?.id || boards[0]?.id || 1, data: columnData })).unwrap();
        message.success('Column created successfully');
      }

      setIsColumnFormVisible(false);
      setEditingColumn(null);
    } catch (error) {
      message.error(error as string);
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
        message="Error Loading Tasks"
        description={error}
        type="error"
        showIcon
        action={
          <Button onClick={() => dispatch(fetchTasks({ projectId }))}>
            Try Again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-600 mt-1">
            Manage and track your project tasks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Add Task Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddTask()}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center" styles={{ body: { padding: '16px' } }}>
          <div className="text-2xl font-bold text-blue-600">
            {tasks.length}
          </div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </Card>
        <Card className="text-center" styles={{ body: { padding: '16px' } }}>
          <div className="text-2xl font-bold text-orange-600">
            {getTaskStats(tasks, columns).in_progress}
          </div>
          <div className="text-sm text-gray-500">In Progress</div>
        </Card>
        <Card className="text-center" styles={{ body: { padding: '16px' } }}>
          <div className="text-2xl font-bold text-purple-600">
            {getTaskStats(tasks, columns).in_review}
          </div>
          <div className="text-sm text-gray-500">In Review</div>
        </Card>
        <Card className="text-center" styles={{ body: { padding: '16px' } }}>
          <div className="text-2xl font-bold text-green-600">
            {getTaskStats(tasks, columns).done}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </Card>
      </div>

      {/* Task View */}
      <Card
        className="shadow-sm border-0"
        styles={{ body: { padding: '24px' } }}
      >
        <TaskKanban
          tasks={tasks}
          columns={columns}
          onView={handleViewTask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onAddTask={handleAddTask}
          onAddColumn={handleAddColumn}
          onEditColumn={handleEditColumn}
          onDeleteColumn={handleDeleteColumn}
          showProject={false} // Don't show project in project detail
          loading={isLoading}
        />
      </Card>

      {/* Task Form Modal */}
      <TaskForm
        visible={isTaskFormVisible}
        onCancel={() => {
          setIsTaskFormVisible(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        task={editingTask}
        projectId={projectId}
        boardId={currentBoard?.id || boards[0]?.id || 1}
        defaultColumnId={columns[0]?.id}
        loading={isLoading}
      />

      {/* Column Form Modal */}
      <ColumnForm
        visible={isColumnFormVisible}
        onCancel={() => {
          setIsColumnFormVisible(false);
          setEditingColumn(null);
        }}
        onSubmit={handleColumnFormSubmit}
        column={editingColumn}
        loading={isLoading}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        columns={columns}
        visible={isTaskDetailVisible}
        onClose={() => {
          setIsTaskDetailVisible(false);
          setSelectedTask(null);
        }}
        loading={isLoading}
      />
    </div>
  );
};

export default ProjectTaskManagement;

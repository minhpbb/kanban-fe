'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Spin } from 'antd';
import { Task } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBoardColumns } from '@/store/slices/kanbanSlice';
import MultipleUserSelect from '@/components/common/MultipleUserSelect';
import dayjs from 'dayjs';

interface TaskFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: Partial<Task>) => void;
  task?: Task | null;
  projectId: number;
  boardId: number;
  defaultColumnId?: number;
  loading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  task,
  projectId,
  boardId,
  defaultColumnId,
  loading = false
}) => {
  const dispatch = useAppDispatch();
  const { columns, isLoading: columnsLoading } = useAppSelector((state) => state.kanban);
  const [form] = Form.useForm();
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  useEffect(() => {
    if (visible && boardId) {
      dispatch(fetchBoardColumns(boardId));
    }
  }, [visible, boardId, dispatch]);

  useEffect(() => {
    if (visible) {
      // Always reset form first
      form.resetFields();
      console.log('TaskForm: Modal opened, task:', task ? 'Edit mode' : 'Create mode');
      
      if (task) {
        // Edit mode
        console.log('TaskForm: Setting edit values for task:', task.title);
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigneeIds: task.assigneeIds,
          columnId: task.columnId,
          dueDate: task.dueDate ? dayjs(task.dueDate) : null,
          labels: task.labels?.join(', '),
          estimatedHours: task.timeTracking?.estimatedHours,
          actualHours: task.timeTracking?.actualHours,
        });
        
        // Fetch assignee info if exists
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          setSelectedUserIds(task.assigneeIds);
        } else {
          setSelectedUserIds([]);
        }
      } else {
        // Add mode - set default values
        console.log('TaskForm: Setting default values for new task');
        form.setFieldsValue({
          priority: 'medium',
          columnId: defaultColumnId,
          estimatedHours: 0,
          actualHours: 0,
        });
        setSelectedUserIds([]);
      }
    } else {
      // When modal closes, reset everything
      console.log('TaskForm: Modal closed, resetting form');
      form.resetFields();
      setSelectedUserIds([]);
    }
  }, [visible, task, form, defaultColumnId]);


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Process labels
      const labels = values.labels 
        ? values.labels.split(',').map((label: string) => label.trim()).filter(Boolean)
        : [];

      // Process time tracking
      const timeTracking = {
        estimatedHours: values.estimatedHours || 0,
        actualHours: values.actualHours || 0,
      };

      const taskData = {
        ...values,
        projectId,
        boardId,
        labels,
        timeTracking,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
        // Remove estimatedHours and actualHours from values since they're in timeTracking
        estimatedHours: undefined,
        actualHours: undefined,
        // For edit mode, keep existing fields
        ...(task && {
          id: task.id,
          createdById: task.createdById,
          order: task.order,
        }),
      };

      onSubmit(taskData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // Get available columns for this board
  const availableColumns = columns.filter(col => col.boardId === boardId);

  if (columnsLoading) {
    return (
      <Modal
        title={task ? 'Edit Task' : 'Add New Task'}
        open={visible}
        onCancel={() => {
          onCancel();
        }}
        footer={null}
        width={600}
      >
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={task ? 'Edit Task' : 'Add New Task'}
      open={visible}
      onCancel={() => {
        onCancel();
      }}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      okText={task ? 'Update' : 'Create'}
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          name="title"
          label="Task Title"
          rules={[{ required: true, message: 'Please enter task title' }]}
        >
          <Input placeholder="Enter task title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Enter task description"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select>
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="columnId"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              {availableColumns.map(column => (
                <Select.Option key={column.id} value={column.id}>
                  {column.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="assigneeIds"
            label="Assignees"
          >
            <MultipleUserSelect
              value={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder="Select assignees..."
            />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </div>

        <Form.Item
          name="labels"
          label="Labels"
          help="Separate multiple labels with commas"
        >
          <Input placeholder="e.g., frontend, bug, urgent" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="estimatedHours"
            label="Estimated Hours"
          >
            <InputNumber 
              min={0} 
              className="w-full" 
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            name="actualHours"
            label="Actual Hours"
          >
            <InputNumber 
              min={0} 
              className="w-full" 
              placeholder="0"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default TaskForm;

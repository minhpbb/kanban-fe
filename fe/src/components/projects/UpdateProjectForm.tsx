'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Upload, Avatar, DatePicker, Switch, Select } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProject } from '@/store/slices/projectSlice';
import { Project } from '@/types/api';
import dayjs from 'dayjs';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload';

interface UpdateProjectFormProps {
  project: Project;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const UpdateProjectForm: React.FC<UpdateProjectFormProps> = ({ 
  project, 
  onSuccess, 
  onCancel 
}) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.projects);
  const [avatar, setAvatar] = useState<string>(project.avatar || '');

  useEffect(() => {
    // Initialize form with project data
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      startDate: project.startDate ? dayjs(project.startDate) : null,
      endDate: project.endDate ? dayjs(project.endDate) : null,
      allowGuestAccess: project.settings?.allowGuestAccess || false,
      defaultTaskStatuses: project.settings?.defaultTaskStatuses || ['To Do', 'In Progress', 'Done'],
      taskLabels: project.settings?.taskLabels || ['Bug', 'Feature', 'Enhancement'],
    });
  }, [project, form]);

  const handleSubmit = async (values: {
    name: string;
    description?: string;
    startDate?: dayjs.Dayjs;
    endDate?: dayjs.Dayjs;
    allowGuestAccess?: boolean;
    defaultTaskStatuses?: string[];
    taskLabels?: string[];
  }) => {
    try {
      const updateData = {
        name: values.name,
        description: values.description,
        avatar: avatar || undefined,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        settings: {
          allowGuestAccess: values.allowGuestAccess || false,
          defaultTaskStatuses: values.defaultTaskStatuses || ['To Do', 'In Progress', 'Done'],
          taskLabels: values.taskLabels || ['Bug', 'Feature', 'Enhancement'],
        },
      };

      const result = await dispatch(updateProject({ 
        id: project.id, 
        data: updateData 
      })).unwrap();
      
      if (result) {
        message.success('Project updated successfully!');
        onSuccess?.();
      }
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleAvatarUpload = (info: UploadChangeParam<UploadFile>) => {
    if (info.file?.status === 'done') {
      setAvatar((info.file.response as { url?: string })?.url || '');
      message.success('Avatar uploaded successfully');
    } else if (info.file?.status === 'error') {
      message.error('Avatar upload failed');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Update Project</h2>
        <p className="text-gray-600 mt-2">Modify your project settings</p>
      </div>

      <Form
        form={form}
        name="updateProject"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        <div className="flex items-center space-x-6 mb-6">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            src={avatar}
            className="border-2 border-gray-200"
          />
          <div>
            <Upload
              name="avatar"
              listType="text"
              showUploadList={false}
              action="/api/upload/avatar"
              onChange={handleAvatarUpload}
            >
              <Button icon={<UploadOutlined />} size="small">
                Change Avatar
              </Button>
            </Upload>
            <p className="text-xs text-gray-500 mt-1">Optional project avatar</p>
          </div>
        </div>

        <Form.Item
          name="name"
          label="Project Name"
          rules={[
            { required: true, message: 'Please enter project name!' },
            { min: 3, message: 'Project name must be at least 3 characters!' },
          ]}
        >
          <Input placeholder="Enter project name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="Describe your project..."
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="startDate"
            label="Start Date"
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="End Date"
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h3>
          
          <Form.Item
            name="allowGuestAccess"
            label="Allow Guest Access"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="defaultTaskStatuses"
            label="Default Task Statuses"
          >
            <Select
              mode="tags"
              placeholder="Add task statuses"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="taskLabels"
            label="Default Task Labels"
          >
            <Select
              mode="tags"
              placeholder="Add task labels"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <Form.Item>
          <div className="flex space-x-3">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              className="flex-1 h-12 text-lg font-medium"
            >
              {isLoading ? 'Updating Project...' : 'Update Project'}
            </Button>
            <Button
              htmlType="button"
              onClick={onCancel}
              className="h-12 px-6"
            >
              Cancel
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UpdateProjectForm;

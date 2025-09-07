'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Upload, Avatar, UploadFile } from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import { UserOutlined, LockOutlined, MailOutlined, UploadOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, redirectTo = '/home' }) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [avatar, setAvatar] = useState<string>('');

  const handleSubmit = async (values: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
  }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = values;
      const result = await dispatch(registerUser({
        ...registerData,
        avatar: avatar || undefined,
      })).unwrap();
      
      if (result) {
        message.success('Registration successful!');
        onSuccess?.();
        router.push(redirectTo);
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
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">Sign up to get started</p>
      </div>

      <Form
        form={form}
        name="register"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[
            { required: true, message: 'Please input your full name!' },
            { min: 2, message: 'Full name must be at least 2 characters!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Enter your full name"
          />
        </Form.Item>

        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, message: 'Please input your username!' },
            { min: 3, message: 'Username must be at least 3 characters!' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Choose a username"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="Enter your email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Create a password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Confirm your password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item label="Avatar (Optional)">
          <div className="flex items-center space-x-4">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              src={avatar}
              className="border-2 border-gray-200"
            />
            <Upload
              name="avatar"
              listType="text"
              showUploadList={false}
              action="/api/upload/avatar"
              onChange={handleAvatarUpload}
            >
              <Button icon={<UploadOutlined />} size="small">
                Upload Avatar
              </Button>
            </Upload>
          </div>
        </Form.Item>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            className="w-full h-12 text-lg font-medium"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center mt-6">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Button type="link" className="p-0 h-auto font-medium">
            Sign in
          </Button>
        </p>
      </div>
    </Card>
  );
};

export default RegisterForm;
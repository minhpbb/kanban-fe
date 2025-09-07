'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectTo = '/home' }) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [rememberMe, setRememberMe] = useState(false);
  const { success, error: showError } = useToast();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      const result = await dispatch(loginUser(values)).unwrap();
      
      if (result) {
        success('Login successful!');
        onSuccess?.();
        router.push(redirectTo);
      }
    } catch (error) {
      showError(error as string);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="username"
          label="Username or Email"
          rules={[
            { required: true, message: 'Please input your username or email!' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Enter username or email"
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
            placeholder="Enter password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item>
          <div className="flex items-center justify-between">
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            >
              Remember me
            </Checkbox>
            <Button type="link" className="p-0 h-auto">
              Forgot password?
            </Button>
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center mt-6">
        <p className="text-gray-600">
          Don&apos;t have an account?{' '}
          <Button 
            type="link" 
            className="p-0 h-auto font-medium"
            onClick={() => router.push('/register')}
          >
            Sign up
          </Button>
        </p>
      </div>
    </Card>
  );
};

export default LoginForm;
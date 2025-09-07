'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tag, Button, Table, Space, Modal, Form, Select, Spin, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { getProjectMembers, addProjectMember, removeProjectMember } from '@/store/slices/projectSlice';
import { ProjectRole, ProjectMember } from '@/types/project';
import { User } from '@/types/user';
import { formatDate } from '@/utils/dateUtils';
import { useToast } from '@/hooks';
import UserSearchSelect from './UserSearchSelect';
import { UserAvatar } from '@/components/common';

interface ProjectMembersProps {
  projectId: number;
}

const ProjectMembers: React.FC<ProjectMembersProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.projects);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const { success, error: showError } = useToast();

  const fetchMembers = useCallback(async () => {
    try {
      const result = await dispatch(getProjectMembers(projectId)).unwrap();
      console.log('Project members result:', result);
      
      // Transform raw data to match ProjectMember interface
      const transformedMembers: ProjectMember[] = (result.members as unknown as Record<string, unknown>[] || []).map((member: Record<string, unknown>) => ({
        id: member.pm_id as number,
        projectId: member.pm_projectId as number,
        userId: member.pm_userId as number,
        role: member.pm_role as ProjectRole,
        isActive: member.pm_isActive as boolean,
        joinedAt: member.pm_joinedAt as string,
        createdAt: member.pm_createdAt as string,
        updatedAt: member.pm_updatedAt as string,
        // User details
        fullName: (member.u_fullName as string) || 'Unknown User',
        email: (member.u_email as string) || '',
        avatar: member.u_avatar as string,
      }));
      
      console.log('Transformed members:', transformedMembers);
      setMembers(transformedMembers);
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    form.setFieldsValue({ userId: user.id });
  };

  const handleAddMember = async (values: { userId: number; role: ProjectRole }) => {
    try {
      console.log('Adding member with data:', values);
      await dispatch(addProjectMember({ projectId, data: values })).unwrap();
      success('Member added successfully');
      setIsAddMemberModalVisible(false);
      setSelectedUser(null);
      form.resetFields();
      fetchMembers();
    } catch (error) {
      showError(error as string);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    console.log('Remove member clicked for userId:', userId, 'projectId:', projectId);
    
    try {
      console.log('About to show Modal.confirm');
      
      // Test with alert first to see if basic dialogs work
      const testResult = alert('Test: Are you sure you want to remove this member?');
      console.log('Alert result:', testResult);
      
      if (testResult === undefined) { // alert always returns undefined
        // Use window.confirm instead of Modal.confirm since Modal.confirm is not working
        const confirmed = window.confirm('Are you sure you want to remove this member from the project?');
        console.log('Window.confirm result:', confirmed);
        
        if (confirmed) {
          try {
            console.log('Confirming remove member:', { projectId, userId });
            await dispatch(removeProjectMember({ projectId, userId })).unwrap();
            success('Member removed successfully');
            fetchMembers();
          } catch (error) {
            console.error('Error removing member:', error);
            showError(error as string);
          }
        } else {
          console.log('Remove member cancelled');
        }
      }
    } catch (error) {
      console.error('Error showing modal:', error);
      // Fallback to window.confirm
      const confirmed = window.confirm('Are you sure you want to remove this member from the project?');
      if (confirmed) {
        try {
          console.log('Confirming remove member (fallback):', { projectId, userId });
          await dispatch(removeProjectMember({ projectId, userId })).unwrap();
          success('Member removed successfully');
          fetchMembers();
        } catch (error) {
          console.error('Error removing member:', error);
          showError(error as string);
        }
      }
    }
  };

  const getRoleColor = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'red';
      case 'member': return 'blue';
      case 'viewer': return 'green';
      default: return 'default';
    }
  };

  // Table columns for team members
  const memberColumns = [
    {
      title: 'Member',
      key: 'member',
                  render: (record: ProjectMember) => (
                    <div className="flex items-center space-x-4">
                      <UserAvatar 
                        user={record} 
                        size="large" 
                      />
                      <div>
                        <div className="px-4 font-medium text-gray-900">{record.fullName}</div>
                        <div className="px-4 text-sm text-gray-500">{record.email}</div>
                      </div>
                    </div>
                  ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string | undefined) => (
        <Tag color={getRoleColor(role || '')}>{(role || '').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      key: 'joined',
      render: (date: string | undefined) => date ? formatDate(date) : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ProjectMember) => {
        console.log('Rendering actions for record:', record);
        return (
          <Space>
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Delete button clicked for record:', record);
                handleRemoveMember(record.userId);
              }}
            />
          </Space>
        );
      },
    },
  ];

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
        message="Error Loading Project Members"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Team Members Table */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Team Members</span>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              className="shadow-sm"
              onClick={() => setIsAddMemberModalVisible(true)}
            >
              Add Member
            </Button>
          </div>
        }
        className="shadow-sm border-0"
        styles={{ body: { padding: '24px' } }}
      >
        <Table
          columns={memberColumns}
          dataSource={members}
          rowKey="id"
          pagination={false}
          size="middle"
          className="modern-table"
        />
      </Card>

      {/* Add Member Modal */}
      <Modal
        title="Add Project Member"
        open={isAddMemberModalVisible}
        onCancel={() => {
          setIsAddMemberModalVisible(false);
          setSelectedUser(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMember}
        >
          <Form.Item
            name="userId"
            label="Select User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <UserSearchSelect
              onSelect={handleUserSelect}
              placeholder="Search users by name or email..."
              excludeUserIds={members.map(m => m.userId)}
            />
          </Form.Item>

          {selectedUser && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <UserAvatar user={selectedUser} size="small" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{selectedUser.fullName}</div>
                  <div className="text-sm text-gray-500">@{selectedUser.username} • {selectedUser.email}</div>
                </div>
                <div className="text-xs text-blue-600 font-medium">Selected</div>
              </div>
            </div>
          )}

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
            initialValue="member"
          >
            <Select size="large">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex space-x-3">
              <Button
                type="primary"
                htmlType="submit"
                className="flex-1"
                size="large"
                disabled={!selectedUser}
              >
                Add Member
              </Button>
              <Button
                htmlType="button"
                onClick={() => {
                  setIsAddMemberModalVisible(false);
                  setSelectedUser(null);
                  form.resetFields();
                }}
                size="large"
              >
                Cancel
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectMembers;

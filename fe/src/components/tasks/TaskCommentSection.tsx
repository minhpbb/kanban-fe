'use client';

import React, { useState, useEffect } from 'react';
import { 
  List, 
  Button, 
  Input, 
  Form, 
  message, 
  Typography, 
  Space,
  Tooltip,
  Popconfirm,
  Spin
} from 'antd';
import { 
  SendOutlined, 
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { getTaskComments, addTaskComment, updateTaskComment, deleteTaskComment } from '@/store/slices/taskSlice';
import { formatDate } from '@/utils/dateUtils';
import { Comment } from '@/types/task';
import { UserAvatar } from '@/components/common';

const { TextArea } = Input;
const { Text } = Typography;

interface TaskCommentSectionProps {
  taskId: number;
  loading?: boolean;
}

const TaskCommentSection: React.FC<TaskCommentSectionProps> = ({
  taskId,
  loading = false
}) => {
  const dispatch = useAppDispatch();
  const { comments, isLoading } = useAppSelector((state) => state.tasks);
  const taskComments = comments[taskId] || [];
  
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Mock user data - replace with real user context
  const currentUser = {
    id: 1,
    fullName: 'Current User',
    avatar: '/avatars/user-1.jpg',
    username: 'currentuser'
  };

  useEffect(() => {
    // Fetch comments when component mounts or taskId changes
    if (taskId) {
      dispatch(getTaskComments(taskId));
    }
  }, [dispatch, taskId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(addTaskComment({ taskId, content: newComment.trim() })).unwrap();
      setNewComment('');
      form.resetFields();
      message.success('Comment added successfully');
      // Refresh comments
      dispatch(getTaskComments(taskId));
    } catch (error) {
      message.error(error as string);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingContent.trim()) {
      message.warning('Please enter a comment');
      return;
    }

    try {
      await dispatch(updateTaskComment({ 
        taskId, 
        commentId, 
        content: editingContent.trim() 
      })).unwrap();
      setEditingCommentId(null);
      setEditingContent('');
      message.success('Comment updated successfully');
      // Refresh comments
      dispatch(getTaskComments(taskId));
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await dispatch(deleteTaskComment({ taskId, commentId })).unwrap();
      message.success('Comment deleted successfully');
      // Refresh comments
      dispatch(getTaskComments(taskId));
    } catch (error) {
      message.error(error as string);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      <div className="bg-gray-50 rounded-lg p-4">
        <Form form={form} layout="vertical">
          <Form.Item
            name="comment"
            rules={[{ required: true, message: 'Please enter a comment' }]}
          >
            <TextArea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAddComment}
              loading={submitting}
              disabled={!newComment.trim()}
            >
              Add Comment
            </Button>
          </div>
        </Form>
      </div>

      {/* Comments List */}
      <div>
        <Text strong className="text-gray-700 mb-3 block">
          Comments ({taskComments.length})
        </Text>
        
        {taskComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">No comments yet</div>
            <div className="text-xs mt-1">Be the first to comment on this task</div>
          </div>
        ) : (
          <List
            dataSource={taskComments}
            loading={isLoading}
            renderItem={(comment) => (
              <List.Item key={comment.id} className="!px-0">
                <div className="w-full">
                  <div className="flex items-start space-x-3">
                    {/* User Avatar */}
                    <UserAvatar
                      user={comment.user}
                      size="small"
                      className="flex-shrink-0"
                    />
                    
                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        {/* Comment Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Text strong className="text-sm">
                              {comment.user?.fullName || `User ${comment.userId}`}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              @{comment.user?.username || 'unknown'}
                            </Text>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Text className="text-xs text-gray-400">
                              {formatDate(comment.createdAt)}
                            </Text>
                            {comment.userId === currentUser.id && (
                              <Space size="small">
                                <Tooltip title="Edit comment">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => startEditing(comment)}
                                    className="text-gray-400 hover:text-blue-500"
                                  />
                                </Tooltip>
                                <Popconfirm
                                  title="Delete comment"
                                  description="Are you sure you want to delete this comment?"
                                  onConfirm={() => handleDeleteComment(comment.id)}
                                  okText="Yes"
                                  cancelText="No"
                                >
                                  <Tooltip title="Delete comment">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      className="text-gray-400 hover:text-red-500"
                                    />
                                  </Tooltip>
                                </Popconfirm>
                              </Space>
                            )}
                          </div>
                        </div>
                        
                        {/* Comment Text */}
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <TextArea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={2}
                              maxLength={500}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="small"
                                icon={<CheckOutlined />}
                                onClick={() => handleEditComment(comment.id)}
                                disabled={!editingContent.trim()}
                              >
                                Save
                              </Button>
                              <Button
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={cancelEditing}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default TaskCommentSection;
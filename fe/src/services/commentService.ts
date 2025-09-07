import { axiosInstance } from '@/lib/axios';

export interface AddCommentRequest {
  content: string;
}

export interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    avatar?: string;
  };
}

export interface CommentResponse {
  comments: Comment[];
}

export const commentService = {
  // Add a comment to a task
  async addTaskComment(taskId: number, data: AddCommentRequest): Promise<{ message: string }> {
    const response = await axiosInstance.post(`/tasks/${taskId}/comments`, data);
    return response.data;
  },

  // Get all comments for a task
  async getTaskComments(taskId: number): Promise<CommentResponse> {
    const response = await axiosInstance.get(`/tasks/${taskId}/comments`);
    console.log('getTaskComments response:', response.data);
    // Handle both direct response and wrapped response
    const data = response.data;
    if (data && data.data && data.data.comments) {
      console.log('Using data.data.comments:', data.data.comments);
      return { comments: data.data.comments };
    } else if (data && data.comments) {
      console.log('Using data.comments:', data.comments);
      return { comments: data.comments };
    } else if (Array.isArray(data)) {
      console.log('Using direct array:', data);
      return { comments: data };
    }
    console.log('No comments found, returning empty array');
    return { comments: [] };
  },

  // Update a comment (if API becomes available)
  async updateTaskComment(taskId: number, commentId: number, data: AddCommentRequest): Promise<{ message: string }> {
    const response = await axiosInstance.patch(`/tasks/${taskId}/comments/${commentId}`, data);
    return response.data;
  },

  // Delete a comment (if API becomes available)
  async deleteTaskComment(taskId: number, commentId: number): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  },
};

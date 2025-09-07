import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Request,
  Res,
  Query,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ServerResponse } from 'http';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permission.decorator';
import { NotificationStatus } from '../entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('sse')
  @ApiOperation({ 
    summary: 'SSE connection for real-time notifications and activities', 
    description: 'Establish Server-Sent Events connection for real-time notifications and project activities' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'SSE connection established',
    headers: {
      'Content-Type': { description: 'text/event-stream' },
      'Cache-Control': { description: 'no-cache' },
      'Connection': { description: 'keep-alive' },
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async getSSEConnection(@Query('userId', ParseIntPipe) userId: number, @Res() res: Response) {
    const serverResponse = res as unknown as ServerResponse;

    console.log('🔌 SSE: New connection request from userId:', userId);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Send initial connection message
    const initialMessage = {
      type: 'connected',
      message: 'SSE connection established',
      userId,
      timestamp: new Date().toISOString(),
    };
    
    console.log('📤 SSE: Sending initial message:', initialMessage);
    res.write(`data: ${JSON.stringify(initialMessage)}\n\n`);

    // Add client to SSE connections
    this.notificationsService.addSSEClient(userId, serverResponse);
    console.log('✅ SSE: Client added to connections for userId:', userId);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })}\n\n`);
      } catch (error) {
        clearInterval(heartbeat);
        this.notificationsService.removeSSEClient(userId, res);
      }
    }, 30000); // Send heartbeat every 30 seconds

    // Clean up on connection close
    res.on('close', () => {
      clearInterval(heartbeat);
      this.notificationsService.removeSSEClient(userId, serverResponse);
    });
  }

  @Get('unread-count')
  @RequirePermissions('notification:read')
  @ApiOperation({ 
    summary: 'Get unread notifications count', 
    description: 'Get count of unread notifications for current user' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Unread count retrieved successfully',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: {
          unreadCount: 5
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount };
  }

  @Get()
  @RequirePermissions('notification:read')
  @ApiOperation({ 
    summary: 'Get user notifications', 
    description: 'Get paginated list of user notifications' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus, description: 'Filter by status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notifications retrieved successfully',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: {
          notifications: [
            {
              id: 1,
              type: 'task_assigned',
              title: 'Task Assigned',
              message: 'John Doe assigned you to task "Fix login bug" in project "My Project"',
              status: 'unread',
              metadata: {
                projectName: 'My Project',
                taskTitle: 'Fix login bug',
                fromUserName: 'John Doe',
                fromUserAvatar: 'uploads/avatars/users/user-1_abc123.jpg'
              },
              createdAt: '2024-01-01T00:00:00.000Z'
            }
          ],
          total: 10,
          unreadCount: 3
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async getNotifications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: NotificationStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.notificationsService.getUserNotifications(req.user.userId, pageNum, limitNum, status);
  }

  @Patch(':id/read')
  @RequirePermissions('notification:update')
  @ApiOperation({ 
    summary: 'Mark notification as read', 
    description: 'Mark a specific notification as read' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification marked as read',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: {
          message: 'Notification marked as read'
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @Request() req,
  ) {
    return this.notificationsService.markAsRead(notificationId, req.user.userId);
  }

  @Patch('read-all')
  @RequirePermissions('notification:update')
  @ApiOperation({ 
    summary: 'Mark all notifications as read', 
    description: 'Mark all user notifications as read' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'All notifications marked as read',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: {
          message: 'All notifications marked as read'
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('notification:delete')
  @ApiOperation({ 
    summary: 'Delete notification', 
    description: 'Delete a specific notification' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification deleted',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: {
          message: 'Notification deleted successfully'
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async deleteNotification(
    @Param('id', ParseIntPipe) notificationId: number,
    @Request() req,
  ) {
    return this.notificationsService.deleteNotification(notificationId, req.user.userId);
  }

  @Patch(':id/archive')
  @RequirePermissions('notification:update')
  @ApiOperation({ 
    summary: 'Archive notification', 
    description: 'Archive a specific notification' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Notification ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification archived',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: {
          message: 'Notification archived'
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async archiveNotification(
    @Param('id', ParseIntPipe) notificationId: number,
    @Request() req,
  ) {
    return this.notificationsService.archiveNotification(notificationId, req.user.userId);
  }
}

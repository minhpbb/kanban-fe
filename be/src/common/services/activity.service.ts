import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ActivityLog, ActivityType } from '../../entities/activity-log.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Log an activity to the database
   */
  async logActivity(
    projectId: number,
    userId: number,
    action: ActivityType,
    description: string,
    metadata?: any,
    entityType?: string,
    entityId?: number,
    isVisible: boolean = true,
  ): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create({
      projectId,
      userId,
      action,
      description,
      metadata: metadata || {},
      entityType,
      entityId,
      isVisible,
    });

    const savedActivity = await this.activityLogRepository.save(activityLog);

    // Send realtime update via SSE
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const activityData = {
        id: savedActivity.id,
        type: action,
        description,
        userId,
        userName: user?.fullName || 'Unknown User',
        userAvatar: user?.avatar,
        metadata: metadata || {},
        entityType,
        entityId,
        createdAt: savedActivity.createdAt.toISOString(),
      };

      // Import NotificationsService dynamically to avoid circular dependency
      const { NotificationsService } = await import('../../notifications/notifications.service');
      const notificationsService = new NotificationsService(
        this.dataSource.getRepository('Notification'),
        this.dataSource.getRepository('User'),
        this.dataSource.getRepository('Project'),
        this.dataSource.getRepository('ProjectMember'),
        this.dataSource.getRepository('Task')
      );
      
      await notificationsService.sendActivityUpdate(projectId, activityData);
    } catch (error) {
      console.error('Failed to send activity update via SSE:', error);
      // Don't throw error, just log it
    }

    return savedActivity;
  }

  /**
   * Get project activities with user information
   */
  async getProjectActivities(
    projectId: number,
    limit: number = 20,
    type?: ActivityType,
  ): Promise<{ activities: any[]; total: number }> {
    let query = this.activityLogRepository
      .createQueryBuilder('al')
      .leftJoin('users', 'u', 'u.id = al.userId')
      .select([
        'al.id as id',
        'al.action as action',
        'al.description as description',
        'al.metadata as metadata',
        'al.entityType as entityType',
        'al.entityId as entityId',
        'al.createdAt as createdAt',
        'u.id as userId',
        'u.fullName as userName',
        'u.avatar as userAvatar',
        'u.username as username',
      ])
      .where('al.projectId = :projectId', { projectId })
      .andWhere('al.isVisible = :isVisible', { isVisible: true })
      .orderBy('al.createdAt', 'DESC')
      .limit(limit);

    if (type) {
      query = query.andWhere('al.action = :action', { action: type });
    }

    const activities = await query.getRawMany();
    const total = await this.activityLogRepository
      .createQueryBuilder('al')
      .where('al.projectId = :projectId', { projectId })
      .andWhere('al.isVisible = :isVisible', { isVisible: true })
      .getCount();

    // Transform the results
    const transformedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.action,
      description: activity.description,
      userId: activity.userId,
      userName: activity.userName,
      userAvatar: activity.userAvatar,
      username: activity.username,
      metadata: activity.metadata,
      entityType: activity.entityType,
      entityId: activity.entityId,
      createdAt: activity.createdAt,
    }));

    return {
      activities: transformedActivities,
      total,
    };
  }

  /**
   * Get user activities across all projects
   */
  async getUserActivities(
    userId: number,
    limit: number = 20,
  ): Promise<{ activities: any[]; total: number }> {
    const activities = await this.activityLogRepository
      .createQueryBuilder('al')
      .leftJoin('users', 'u', 'u.id = al.userId')
      .leftJoin('projects', 'p', 'p.id = al.projectId')
      .select([
        'al.id as id',
        'al.action as action',
        'al.description as description',
        'al.metadata as metadata',
        'al.entityType as entityType',
        'al.entityId as entityId',
        'al.createdAt as createdAt',
        'al.projectId as projectId',
        'u.id as userId',
        'u.fullName as userName',
        'u.avatar as userAvatar',
        'p.name as projectName',
      ])
      .where('al.userId = :userId', { userId })
      .andWhere('al.isVisible = :isVisible', { isVisible: true })
      .orderBy('al.createdAt', 'DESC')
      .limit(limit)
      .getRawMany();

    const total = await this.activityLogRepository
      .createQueryBuilder('al')
      .where('al.userId = :userId', { userId })
      .andWhere('al.isVisible = :isVisible', { isVisible: true })
      .getCount();

    const transformedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.action,
      description: activity.description,
      userId: activity.userId,
      userName: activity.userName,
      userAvatar: activity.userAvatar,
      projectId: activity.projectId,
      projectName: activity.projectName,
      metadata: activity.metadata,
      entityType: activity.entityType,
      entityId: activity.entityId,
      createdAt: activity.createdAt,
    }));

    return {
      activities: transformedActivities,
      total,
    };
  }

  /**
   * Get activity statistics for a project
   */
  async getProjectActivityStats(projectId: number, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.activityLogRepository
      .createQueryBuilder('al')
      .select([
        'al.action',
        'COUNT(*) as count',
        'DATE(al.createdAt) as date',
      ])
      .where('al.projectId = :projectId', { projectId })
      .andWhere('al.createdAt >= :startDate', { startDate })
      .andWhere('al.isVisible = :isVisible', { isVisible: true })
      .groupBy('al.action, DATE(al.createdAt)')
      .orderBy('date', 'DESC')
      .getRawMany();

    return stats;
  }

  /**
   * Clean up old activity logs (for maintenance)
   */
  async cleanupOldLogs(daysOld: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.activityLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}

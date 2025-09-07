import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from '../entities/project.entity';
import { ProjectMember, ProjectRole } from '../entities/project-member.entity';
import { User } from '../entities/user.entity';
import { KanbanBoard } from '../entities/kanban-board.entity';
import { KanbanColumn, ColumnType, ColumnColor } from '../entities/kanban-column.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../common/services/activity.service';
import { ActivityType } from '../entities/activity-log.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(KanbanBoard)
    private readonly kanbanBoardRepository: Repository<KanbanBoard>,
    @InjectRepository(KanbanColumn)
    private readonly kanbanColumnRepository: Repository<KanbanColumn>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
  ) { }

  async createProject(createProjectDto: CreateProjectDto, ownerId: number): Promise<Project> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create project
      const project = this.projectRepository.create({
        ...createProjectDto,
        ownerId,
        status: 'active' as any,
      });

      const savedProject = await queryRunner.manager.save(project);

      // Add owner as project member with admin role
      const projectMember = this.projectMemberRepository.create({
        projectId: savedProject.id,
        userId: ownerId,
        role: ProjectRole.ADMIN,
        isActive: true,
      });

      await queryRunner.manager.save(projectMember);

      // Create default Kanban board for the project
      const defaultBoard = this.kanbanBoardRepository.create({
        name: `${savedProject.name} Board`,
        description: `Default Kanban board for ${savedProject.name}`,
        projectId: savedProject.id,
        createdById: ownerId,
        isActive: true,
        settings: {
          allowColumnCreation: true,
          allowColumnDeletion: true,
          allowColumnReordering: true,
          defaultColumns: ['To Do', 'In Progress', 'Done'],
          maxColumns: 10,
        },
      });

      const savedBoard = await queryRunner.manager.save(defaultBoard);

      // Create default columns
      const defaultColumns = [
        { name: 'To Do', description: 'Tasks to be done', type: ColumnType.SYSTEM, color: ColumnColor.BLUE, order: 0 },
        { name: 'In Progress', description: 'Tasks currently being worked on', type: ColumnType.SYSTEM, color: ColumnColor.ORANGE, order: 1 },
        { name: 'Done', description: 'Completed tasks', type: ColumnType.SYSTEM, color: ColumnColor.GREEN, order: 2 },
      ];

      for (const columnData of defaultColumns) {
        const column = this.kanbanColumnRepository.create({
          ...columnData,
          boardId: savedBoard.id,
          isActive: true,
          maxTasks: 0,
          isWipLimit: false,
        });
        await queryRunner.manager.save(column);
      }

      // Log activity
      await this.activityService.logActivity(
        savedProject.id,
        ownerId,
        ActivityType.PROJECT_CREATED,
        `Project "${savedProject.name}" was created`,
        { projectId: savedProject.id },
        'project',
        savedProject.id,
      );

      await queryRunner.commitTransaction();
      return savedProject;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllProjects(userId: number, page: number = 1, limit: number = 10): Promise<{ projects: Project[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get projects where user is owner or member
    const [projects, total] = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project_members', 'pm', 'pm.projectId = project.id AND pm.userId = :userId', { userId })
      .where('project.ownerId = :userId OR pm.userId = :userId', { userId })
      .andWhere('project.status != :deletedStatus', { deletedStatus: 'deleted' })
      .orderBy('project.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { projects, total };
  }

  async findProjectById(id: number, userId: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, status: 'active' as any },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to this project
    const hasAccess = await this.checkProjectAccess(project.id, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async updateProject(id: number, updateProjectDto: UpdateProjectDto, userId: number): Promise<Project> {
    const project = await this.findProjectById(id, userId);

    // Check if user is owner or admin
    const isOwner = project.ownerId === userId;
    const isAdmin = await this.isProjectAdmin(project.id, userId);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only project owner or admin can update project');
    }

    // Update project
    const oldName = project.name;
    Object.assign(project, updateProjectDto);
    const savedProject = await this.projectRepository.save(project);

    // Log activity
    await this.activityService.logActivity(
      project.id,
      userId,
      ActivityType.PROJECT_UPDATED,
      `Project "${oldName}" was updated`,
      {
        projectId: project.id,
        oldName,
        newName: savedProject.name,
        changes: updateProjectDto,
      },
      'project',
      project.id,
    );

    return savedProject;
  }

  // ========== SOFT DELETE METHODS ==========

  async softDeleteProject(id: number, userId: number): Promise<{ message: string }> {
    const project = await this.findProjectById(id, userId);

    // Only owner can delete project
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only project owner can delete project');
    }

    // Use transaction to ensure data integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Soft delete project
      project.status = 'deleted' as any;
      await queryRunner.manager.save(project);

      // 2. Soft delete all project members
      await queryRunner.manager.update(
        'project_members',
        { projectId: id, isActive: true },
        { isActive: false, leftAt: new Date() }
      );

      // 3. Soft delete all kanban boards
      await queryRunner.manager.update(
        'kanban_boards',
        { projectId: id, isActive: true },
        { isActive: false }
      );

      // 4. Soft delete all kanban columns (through boards)
      const boards = await queryRunner.manager.find('kanban_boards', {
        where: { projectId: id }
      });

      if (boards.length > 0) {
        const boardIds = boards.map(board => (board as any).id);
        await queryRunner.manager.update(
          'kanban_columns',
          { boardId: boardIds as any, isActive: true },
          { isActive: false }
        );
      }

      // 5. Soft delete all tasks
      await queryRunner.manager.update(
        'tasks',
        { projectId: id, deletedAt: null },
        { deletedAt: new Date() }
      );

      // 6. Archive all project-related notifications
      await queryRunner.manager.update(
        'notifications',
        { projectId: id, status: 'unread' },
        { status: 'archived', archivedAt: new Date() }
      );

      await queryRunner.commitTransaction();
      return { message: 'Project and all related data soft deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== HARD DELETE METHODS ==========

  async hardDeleteProject(id: number, userId: number): Promise<{ message: string }> {
    const project = await this.findProjectById(id, userId);

    // Only owner can delete project
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only project owner can delete project');
    }

    // Use transaction to ensure data integrity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Hard delete all project members
      await queryRunner.manager.delete(
        'project_members',
        { projectId: id }
      );

      // 2. Hard delete all kanban boards (and their columns, tasks)
      const boards = await queryRunner.manager.find('kanban_boards', {
        where: { projectId: id }
      });

      if (boards.length > 0) {
        const boardIds = boards.map(board => (board as any).id);

        // Hard delete all tasks in all boards
        await queryRunner.manager.delete(
          'tasks',
          { boardId: boardIds as any }
        );

        // Hard delete all columns in all boards
        await queryRunner.manager.delete(
          'kanban_columns',
          { boardId: boardIds as any }
        );

        // Hard delete all boards
        await queryRunner.manager.delete(
          'kanban_boards',
          { projectId: id }
        );
      }

      // 3. Hard delete all tasks directly linked to project
      await queryRunner.manager.delete(
        'tasks',
        { projectId: id }
      );

      // 4. Hard delete all project-related notifications
      await queryRunner.manager.delete(
        'notifications',
        { projectId: id }
      );

      // 5. Hard delete the project itself
      await queryRunner.manager.delete(
        'projects',
        { id: id }
      );

      await queryRunner.commitTransaction();
      return { message: 'Project and all related data hard deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== LEGACY METHOD (for backward compatibility) ==========

  async deleteProject(id: number, userId: number): Promise<{ message: string }> {
    // Default to soft delete for backward compatibility
    return this.softDeleteProject(id, userId);
  }

  async addProjectMember(projectId: number, memberUserId: number, role: ProjectRole, currentUserId: number): Promise<{ message: string }> {
    const project = await this.findProjectById(projectId, currentUserId);

    // Check if current user is owner or admin
    const isOwner = project.ownerId === currentUserId;
    const isAdmin = await this.isProjectAdmin(projectId, currentUserId);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only project owner or admin can add members');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: memberUserId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    console.log('Checking existing member for projectId:', projectId, 'memberUserId:', memberUserId);
    const existingMember = await this.projectMemberRepository.findOne({
      where: { projectId, userId: memberUserId, isActive: true },
    });

    if (existingMember) {
      console.log('Existing member found:', existingMember);
      throw new ConflictException('User is already a member of this project');
    }

    // Add member
    const projectMember = this.projectMemberRepository.create({
      projectId,
      userId: memberUserId,
      role,
      isActive: true,
      joinedAt: new Date(),
    });

    await this.projectMemberRepository.save(projectMember);

    // Log activity
    await this.activityService.logActivity(
      projectId,
      currentUserId,
      ActivityType.MEMBER_ADDED,
      `User "${user.fullName}" was added to the project as ${role}`,
      {
        projectId,
        memberId: projectMember.id,
        memberUserId,
        role,
        memberName: user.fullName,
      },
      'member',
      projectMember.id,
    );

    // Send notification to the added member
    await this.notificationsService.createProjectMemberAddedNotification(
      memberUserId,
      projectId,
      currentUserId,
      role,
    );

    return { message: 'Member added successfully' };
  }

  async removeProjectMember(projectId: number, memberUserId: number, currentUserId: number): Promise<{ message: string }> {
    const project = await this.findProjectById(projectId, currentUserId);

    // Check if current user is owner or admin
    const isOwner = project.ownerId === currentUserId;
    const isAdmin = await this.isProjectAdmin(projectId, currentUserId);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only project owner or admin can remove members');
    }

    // Cannot remove owner
    if (project.ownerId === memberUserId) {
      throw new ForbiddenException('Cannot remove project owner');
    }

    // Remove member
    await this.projectMemberRepository.update(
      { projectId, userId: memberUserId },
      { isActive: false, leftAt: new Date() }
    );

    // Auto unassign all tasks assigned to this member in this project
    await this.dataSource
      .createQueryBuilder()
      .update('tasks')
      .set({ 
        assigneeId: null,
        updatedAt: new Date()
      })
      .where('projectId = :projectId', { projectId })
      .andWhere('assigneeId = :assigneeId', { assigneeId: memberUserId })
      .execute();

    // Log activity
    const user = await this.userRepository.findOne({ where: { id: memberUserId } });
    await this.activityService.logActivity(
      projectId,
      currentUserId,
      ActivityType.MEMBER_REMOVED,
      `User "${user?.fullName || 'Unknown User'}" was removed from the project`,
      {
        projectId,
        memberUserId,
        memberName: user?.fullName || 'Unknown User',
        unassignedTasks: true,
      },
      'member',
      null,
    );

    // Send notification to the removed member
    await this.notificationsService.createProjectMemberRemovedNotification(
      memberUserId,
      projectId,
      currentUserId,
    );

    return { message: 'Member removed successfully' };
  }

  async getProjectMembers(projectId: number, userId: number): Promise<{ members: any[] }> {
    await this.findProjectById(projectId, userId);

    const members = await this.projectMemberRepository
      .createQueryBuilder('pm')
      .leftJoin('users', 'u', 'u.id = pm.userId')
      .select([
        'pm.id',
        'pm.userId',
        'pm.role',
        'pm.isActive',
        'pm.joinedAt',
        'u.username',
        'u.email',
        'u.fullName',
        'u.avatar',
      ])
      .where('pm.projectId = :projectId', { projectId })
      .andWhere('pm.isActive = :isActive', { isActive: true })
      .getRawMany();

    return { members };
  }

  private async checkProjectAccess(projectId: number, userId: number): Promise<boolean> {
    // Check if user is owner
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (project?.ownerId === userId) {
      return true;
    }

    // Check if user is a member
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    return !!member;
  }

  private async isProjectAdmin(projectId: number, userId: number): Promise<boolean> {
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    return member?.role === ProjectRole.ADMIN;
  }

  async getProjectOverview(projectId: number, userId: number): Promise<any> {
    await this.findProjectById(projectId, userId);

    // Get project basic info
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    // Get project statistics
    const statistics = await this.getProjectStatistics(projectId, userId);

    // Get recent activities
    const recentActivities = await this.getProjectActivities(projectId, userId, 10);

    // Get task distribution
    const taskDistribution = await this.getTaskDistribution(projectId);

    return {
      project,
      statistics,
      recentActivities: recentActivities.activities,
      taskDistribution,
    };
  }

  async getProjectStatistics(projectId: number, userId: number, period?: string): Promise<any> {
    await this.findProjectById(projectId, userId);

    // Get task counts
    const taskStats = await this.dataSource
      .createQueryBuilder()
      .select([
        'COUNT(*) as totalTasks',
        'SUM(CASE WHEN t.deletedAt IS NULL THEN 1 ELSE 0 END) as activeTasks',
        'SUM(CASE WHEN t.dueDate < NOW() AND t.deletedAt IS NULL THEN 1 ELSE 0 END) as overdueTasks',
      ])
      .from('tasks', 't')
      .where('t.projectId = :projectId', { projectId })
      .getRawOne();

    // Get member count
    const memberCount = await this.projectMemberRepository.count({
      where: { projectId, isActive: true },
    });

    // Get completion percentage (tasks in "Done" columns)
    const completionStats = await this.dataSource
      .createQueryBuilder()
      .select([
        'COUNT(*) as totalActiveTasks',
        'SUM(CASE WHEN LOWER(kc.name) LIKE \'%done%\' OR LOWER(kc.name) LIKE \'%completed%\' THEN 1 ELSE 0 END) as completedTasks',
      ])
      .from('tasks', 't')
      .leftJoin('kanban_columns', 'kc', 'kc.id = t.columnId')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.deletedAt IS NULL')
      .getRawOne();

    const completionPercentage = completionStats.totalActiveTasks > 0
      ? Math.round((completionStats.completedTasks / completionStats.totalActiveTasks) * 100)
      : 0;

    // Get tasks by priority
    const priorityStats = await this.dataSource
      .createQueryBuilder()
      .select(['t.priority', 'COUNT(*) as count'])
      .from('tasks', 't')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.deletedAt IS NULL')
      .groupBy('t.priority')
      .getRawMany();

    const priorityDistribution = priorityStats.reduce((acc, stat) => {
      acc[stat.priority] = parseInt(stat.count);
      return acc;
    }, {});

    // Get top contributors (users with most completed tasks)
    // Note: This query is complex with JSON array, so we'll get all completed tasks first
    const completedTasks = await this.dataSource
      .createQueryBuilder()
      .select(['t.id', 't.assigneeIds'])
      .from('tasks', 't')
      .leftJoin('kanban_columns', 'kc', 'kc.id = t.columnId')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.deletedAt IS NULL')
      .andWhere('t.assigneeIds IS NOT NULL')
      .andWhere('(LOWER(kc.name) LIKE \'%done%\' OR LOWER(kc.name) LIKE \'%completed%\')')
      .getRawMany();

    // Process assigneeIds and count contributions
    const contributorCounts = new Map<number, number>();
    const contributorInfo = new Map<number, any>();

    for (const task of completedTasks) {
      if (task.assigneeIds) {
        try {
          const assigneeIds = JSON.parse(task.assigneeIds);
          if (Array.isArray(assigneeIds)) {
            for (const userId of assigneeIds) {
              contributorCounts.set(userId, (contributorCounts.get(userId) || 0) + 1);
            }
          }
        } catch (error) {
          console.warn('Failed to parse assigneeIds:', task.assigneeIds);
        }
      }
    }

    // Get user info for top contributors
    const topContributorIds = Array.from(contributorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId]) => userId);

    const topContributors = [];
    if (topContributorIds.length > 0) {
      const users = await this.dataSource
        .createQueryBuilder()
        .select(['u.id', 'u.fullName', 'u.avatar'])
        .from('users', 'u')
        .where('u.id IN (:...userIds)', { userIds: topContributorIds })
        .getRawMany();

      for (const userId of topContributorIds) {
        const user = users.find(u => u.id === userId);
        if (user) {
          topContributors.push({
            userId: user.id,
            userName: user.fullName,
            avatar: user.avatar,
            tasksCompleted: contributorCounts.get(userId) || 0,
          });
        }
      }
    }

    return {
      totalTasks: parseInt(taskStats.totalTasks) || 0,
      completedTasks: parseInt(completionStats.completedTasks) || 0,
      inProgressTasks: parseInt(taskStats.activeTasks) - parseInt(completionStats.completedTasks) || 0,
      overdueTasks: parseInt(taskStats.overdueTasks) || 0,
      totalMembers: memberCount,
      completionPercentage,
      priorityDistribution,
      topContributors,
    };
  }

  async getProjectActivities(projectId: number, userId: number, limit: number = 20, type?: string): Promise<any> {
    await this.findProjectById(projectId, userId);

    // Use ActivityService to get real activity logs
    const activityType = type ? type as ActivityType : undefined;
    return await this.activityService.getProjectActivities(projectId, limit, activityType);
  }

  private async getTaskDistribution(projectId: number): Promise<any> {
    // Get tasks by column (status)
    const statusStats = await this.dataSource
      .createQueryBuilder()
      .select(['kc.name as status', 'COUNT(*) as count'])
      .from('tasks', 't')
      .leftJoin('kanban_columns', 'kc', 'kc.id = t.columnId')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.deletedAt IS NULL')
      .groupBy('kc.name')
      .getRawMany();

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});

    // Get tasks by priority
    const priorityStats = await this.dataSource
      .createQueryBuilder()
      .select(['t.priority', 'COUNT(*) as count'])
      .from('tasks', 't')
      .where('t.projectId = :projectId', { projectId })
      .andWhere('t.deletedAt IS NULL')
      .groupBy('t.priority')
      .getRawMany();

    const byPriority = priorityStats.reduce((acc, stat) => {
      acc[stat.priority] = parseInt(stat.count);
      return acc;
    }, {});

    return {
      byStatus,
      byPriority,
    };
  }
}

import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { KanbanBoard } from '../entities/kanban-board.entity';
import { KanbanColumn } from '../entities/kanban-column.entity';
import { Project } from '../entities/project.entity';
import { ProjectMember, ProjectRole } from '../entities/project-member.entity';
import { User } from '../entities/user.entity';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, ReorderTasksDto, AddCommentDto } from './dto/task.dto';
import { TaskPriority } from '../entities/task.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { FileUploadService } from '../common/services/file-upload.service';
import { ActivityService } from '../common/services/activity.service';
import { ActivityType } from '../entities/activity-log.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(KanbanBoard)
    private readonly kanbanBoardRepository: Repository<KanbanBoard>,
    @InjectRepository(KanbanColumn)
    private readonly kanbanColumnRepository: Repository<KanbanColumn>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly fileUploadService: FileUploadService,
    private readonly activityService: ActivityService,
  ) {}

  // ========== TASK CRUD METHODS ==========

  async createTask(createTaskDto: CreateTaskDto, userId: number): Promise<Task> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate project, board, and column access
      await this.validateTaskAccess(createTaskDto.projectId, createTaskDto.boardId, createTaskDto.columnId, userId);

      // Get next order position in column
      const maxOrder = await this.taskRepository
        .createQueryBuilder('task')
        .select('MAX(task.order)', 'maxOrder')
        .where('task.columnId = :columnId', { columnId: createTaskDto.columnId })
        .getRawOne();

      const nextOrder = (maxOrder?.maxOrder || -1) + 1;

      // Create task
      const task = this.taskRepository.create({
        ...createTaskDto,
        createdById: userId,
        order: nextOrder,
        priority: createTaskDto.priority ?? TaskPriority.MEDIUM,
        // Handle multiple assignees
        assigneeIds: createTaskDto.assigneeIds || [],
      });

      const savedTask = await queryRunner.manager.save(task);

      // Log activity
      await this.activityService.logActivity(
        createTaskDto.projectId,
        userId,
        ActivityType.TASK_CREATED,
        `Task "${savedTask.title}" was created`,
        { 
          taskId: savedTask.id,
          taskTitle: savedTask.title,
          columnId: savedTask.columnId,
          priority: savedTask.priority,
        },
        'task',
        savedTask.id,
      );

      // Send notification to assignees if task is assigned to someone
      if (savedTask.assigneeIds && savedTask.assigneeIds.length > 0) {
        for (const assigneeId of savedTask.assigneeIds) {
          if (assigneeId !== userId) {
            await this.notificationsService.createTaskAssignedNotification(
              assigneeId,
              savedTask.id,
              userId,
            );
          }
        }
      }

      await queryRunner.commitTransaction();
      return savedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getProjectTasks(projectId: number, userId: number, boardId?: number): Promise<{ tasks: Task[] }> {
    // Check project access
    await this.checkProjectAccess(projectId, userId);

    let query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId })
      .orderBy('task.order', 'ASC');

    if (boardId) {
      query = query.andWhere('task.boardId = :boardId', { boardId });
    }

    const tasks = await query.getMany();
    return { tasks };
  }

  async getColumnTasks(columnId: number, userId: number): Promise<{ tasks: Task[] }> {
    // Get column and validate access
    const column = await this.kanbanColumnRepository.findOne({
      where: { id: columnId, isActive: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkProjectAccess(column.boardId, userId);

    const tasks = await this.taskRepository.find({
      where: { columnId, projectId: column.boardId },
      order: { order: 'ASC' },
    });

    return { tasks };
  }

  async getTaskById(taskId: number, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check project access
    await this.checkProjectAccess(task.projectId, userId);

    return task;
  }

  async updateTask(taskId: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<Task> {
    const task = await this.getTaskById(taskId, userId);

    // Check if user can update task
    const canUpdate = await this.checkTaskPermission(task, userId, 'update');
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    // If changing column, validate new column access
    if (updateTaskDto.columnId && updateTaskDto.columnId !== task.columnId) {
      await this.validateColumnAccess(updateTaskDto.columnId, task.projectId, userId);
    }

    // Check if assignee is being changed
    const oldAssigneeIds = task.assigneeIds || [];
    const newAssigneeIds = updateTaskDto.assigneeIds;

    Object.assign(task, updateTaskDto);
    
    // Handle multiple assignees
    if (newAssigneeIds !== undefined) {
      task.assigneeIds = newAssigneeIds;
    }
    const savedTask = await this.taskRepository.save(task);

    // Log activity
    await this.activityService.logActivity(
      task.projectId,
      userId,
      ActivityType.TASK_UPDATED,
      `Task "${task.title}" was updated`,
      { 
        taskId: task.id,
        taskTitle: task.title,
        changes: updateTaskDto,
        oldAssigneeIds,
        newAssigneeIds,
      },
      'task',
      task.id,
    );

    // Send notifications for assignee changes
    if (JSON.stringify(oldAssigneeIds) !== JSON.stringify(newAssigneeIds)) {
      // Find removed assignees
      const removedAssignees = oldAssigneeIds.filter(id => !newAssigneeIds?.includes(id));
      // Find added assignees
      const addedAssignees = newAssigneeIds?.filter(id => !oldAssigneeIds.includes(id)) || [];
      
      // Send unassigned notifications
      for (const assigneeId of removedAssignees) {
        if (assigneeId !== userId) {
          await this.notificationsService.createTaskUnassignedNotification(
            assigneeId,
            task.id,
            userId,
          );
        }
      }
      
      // Send assigned notifications
      for (const assigneeId of addedAssignees) {
        if (assigneeId !== userId) {
          await this.notificationsService.createTaskAssignedNotification(
            assigneeId,
            task.id,
            userId,
          );
        }
      }
    }

    // Send notification to assignees if task was updated (but not assigned to them)
    if (savedTask.assigneeIds && savedTask.assigneeIds.length > 0) {
      for (const assigneeId of savedTask.assigneeIds) {
        if (assigneeId !== userId) {
          await this.notificationsService.createTaskUpdatedNotification(
            assigneeId,
            task.id,
            userId,
          );
        }
      }
    }

    return savedTask;
  }

  // ========== SOFT DELETE METHODS ==========

  async softDeleteTask(taskId: number, userId: number): Promise<{ message: string }> {
    const task = await this.getTaskById(taskId, userId);

    // Check if user can delete task
    const canDelete = await this.checkTaskPermission(task, userId, 'delete');
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    // Soft delete - set deletedAt timestamp
    task.deletedAt = new Date();
    await this.taskRepository.save(task);

    // Log activity
    await this.activityService.logActivity(
      task.projectId,
      userId,
      ActivityType.TASK_DELETED,
      `Task "${task.title}" was deleted`,
      { 
        taskId: task.id,
        taskTitle: task.title,
        columnId: task.columnId,
        priority: task.priority,
      },
      'task',
      task.id,
    );

    // Send notification to assignees if task was assigned to someone
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      for (const assigneeId of task.assigneeIds) {
        if (assigneeId !== userId) {
          await this.notificationsService.createTaskDeletedNotification(
            assigneeId,
            task.id,
            userId,
          );
        }
      }
    }
    
    return { message: 'Task soft deleted successfully' };
  }

  // ========== HARD DELETE METHODS ==========

  async hardDeleteTask(taskId: number, userId: number): Promise<{ message: string }> {
    const task = await this.getTaskById(taskId, userId);

    // Check if user can delete task
    const canDelete = await this.checkTaskPermission(task, userId, 'delete');
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    // Hard delete - remove task completely
    await this.taskRepository.remove(task);
    
    return { message: 'Task hard deleted successfully' };
  }

  // ========== LEGACY METHOD (for backward compatibility) ==========

  async deleteTask(taskId: number, userId: number): Promise<{ message: string }> {
    // Default to hard delete for backward compatibility
    return this.hardDeleteTask(taskId, userId);
  }

  // ========== DRAG & DROP METHODS ==========

  async moveTask(taskId: number, moveTaskDto: MoveTaskDto, userId: number): Promise<{ message: string }> {
    const task = await this.getTaskById(taskId, userId);

    // Check if user can move task
    const canMove = await this.checkTaskPermission(task, userId, 'move');
    if (!canMove) {
      throw new ForbiddenException('You do not have permission to move this task');
    }

    // Validate target column access
    await this.validateColumnAccess(moveTaskDto.targetColumnId, task.projectId, userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update task column
      task.columnId = moveTaskDto.targetColumnId;

      // Set new order position
      if (moveTaskDto.newOrder !== undefined) {
        task.order = moveTaskDto.newOrder;
      } else {
        // Get next order position in target column
        const maxOrder = await queryRunner.manager
          .createQueryBuilder(Task, 'task')
          .select('MAX(task.order)', 'maxOrder')
          .where('task.columnId = :columnId', { columnId: moveTaskDto.targetColumnId })
          .getRawOne();

        task.order = (maxOrder?.maxOrder || -1) + 1;
      }

      await queryRunner.manager.save(task);

      // Log activity
      await this.activityService.logActivity(
        task.projectId,
        userId,
        ActivityType.TASK_MOVED,
        `Task "${task.title}" was moved to a different column`,
        { 
          taskId: task.id,
          taskTitle: task.title,
          oldColumnId: task.columnId,
          newColumnId: moveTaskDto.targetColumnId,
          newOrder: moveTaskDto.newOrder,
        },
        'task',
        task.id,
      );

      // Send notification to assignees if task was moved
      if (task.assigneeIds && task.assigneeIds.length > 0) {
        for (const assigneeId of task.assigneeIds) {
          if (assigneeId !== userId) {
            await this.notificationsService.createTaskMovedNotification(
              assigneeId,
              task.id,
              userId,
            );
          }
        }
      }

      // Reorder other tasks in the target column if needed
      if (moveTaskDto.newOrder !== undefined) {
        await this.reorderTasksInColumnHelper(queryRunner, moveTaskDto.targetColumnId, taskId, moveTaskDto.newOrder);
      }

      await queryRunner.commitTransaction();
      return { message: 'Task moved successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reorderTasksInColumn(columnId: number, reorderDto: ReorderTasksDto, userId: number): Promise<{ message: string }> {
    // Get column and validate access
    const column = await this.kanbanColumnRepository.findOne({
      where: { id: columnId, isActive: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkProjectAccess(column.boardId, userId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update order for each task
      for (let i = 0; i < reorderDto.taskIds.length; i++) {
        await queryRunner.manager.update(
          Task,
          { id: reorderDto.taskIds[i], columnId },
          { order: i }
        );
      }

      await queryRunner.commitTransaction();
      return { message: 'Tasks reordered successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== COMMENT METHODS ==========

  async addComment(taskId: number, addCommentDto: AddCommentDto, userId: number): Promise<{ message: string }> {
    const task = await this.getTaskById(taskId, userId);

    // Check if user can comment on task
    const canComment = await this.checkTaskPermission(task, userId, 'comment');
    if (!canComment) {
      throw new ForbiddenException('You do not have permission to comment on this task');
    }

    // Generate comment ID
    const commentId = Date.now(); // Simple ID generation

    // Add comment to task
    const comments = task.comments || [];
    comments.push({
      id: commentId,
      userId,
      content: addCommentDto.content,
      createdAt: new Date(),
    });

    task.comments = comments;
    await this.taskRepository.save(task);

    // Log activity
    await this.activityService.logActivity(
      task.projectId,
      userId,
      ActivityType.TASK_COMMENTED,
      `Comment added to task "${task.title}"`,
      { 
        taskId: task.id,
        taskTitle: task.title,
        commentId: commentId,
        commentContent: addCommentDto.content,
      },
      'task',
      task.id,
    );

    // Send notification to task assignees and creator (if different from commenter)
    const notifyUsers = [...(task.assigneeIds || []), task.createdById].filter(
      (id) => id && id !== userId
    );

    for (const notifyUserId of notifyUsers) {
      await this.notificationsService.createTaskCommentedNotification(
        notifyUserId,
        taskId,
        userId,
      );
    }

    return { message: 'Comment added successfully' };
  }

  async getTaskComments(taskId: number, userId: number): Promise<{ comments: any[] }> {
    const task = await this.getTaskById(taskId, userId);
    
    if (!task.comments || task.comments.length === 0) {
      return { comments: [] };
    }

    // Get unique user IDs from comments
    const userIds = [...new Set(task.comments.map(comment => comment.userId))];
    
    // Fetch user data for all comment authors
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      select: ['id', 'username', 'fullName', 'email', 'avatar']
    });

    // Create user lookup map
    const userMap = new Map(users.map(user => [user.id, user]));

    // Enrich comments with user data
    const enrichedComments = task.comments.map(comment => ({
      ...comment,
      user: userMap.get(comment.userId) || null
    }));

    return { comments: enrichedComments };
  }

  // ========== PRIVATE HELPER METHODS ==========

  private async validateTaskAccess(projectId: number, boardId: number, columnId: number, userId: number): Promise<void> {
    // Check project access
    await this.checkProjectAccess(projectId, userId);

    // Check board access
    const board = await this.kanbanBoardRepository.findOne({
      where: { id: boardId, projectId, isActive: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found or does not belong to project');
    }

    // Check column access
    await this.validateColumnAccess(columnId, projectId, userId);
  }

  private async validateColumnAccess(columnId: number, projectId: number, userId: number): Promise<void> {
    const column = await this.kanbanColumnRepository.findOne({
      where: { id: columnId, isActive: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    // Check if column belongs to a board in the project
    const board = await this.kanbanBoardRepository.findOne({
      where: { id: column.boardId, projectId, isActive: true },
    });

    if (!board) {
      throw new NotFoundException('Column does not belong to project');
    }
  }

  private async checkProjectAccess(projectId: number, userId: number): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, status: 'active' as any },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is owner
    if (project.ownerId === userId) {
      return;
    }

    // Check if user is a member
    const member = await this.projectMemberRepository.findOne({
      where: { projectId, userId, isActive: true },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private async checkTaskPermission(task: Task, userId: number, action: 'read' | 'update' | 'delete' | 'move' | 'comment'): Promise<boolean> {
    // Project owner has all permissions
    const project = await this.projectRepository.findOne({
      where: { id: task.projectId },
    });

    if (project?.ownerId === userId) {
      return true;
    }

    // Check if user is project admin
    const member = await this.projectMemberRepository.findOne({
      where: { projectId: task.projectId, userId, isActive: true },
    });

    if (member?.role === ProjectRole.ADMIN) {
      return true;
    }

    // Task creator can update/delete their own tasks
    if (task.createdById === userId && (action === 'update' || action === 'delete')) {
      return true;
    }

    // Task assignee can update/comment on assigned tasks
    if (task.assigneeIds && task.assigneeIds.includes(userId) && (action === 'update' || action === 'comment')) {
      return true;
    }

    // All project members can read, comment, and move tasks
    if (member && (action === 'read' || action === 'comment' || action === 'move')) {
      return true;
    }

    // Only viewers cannot move tasks
    if (member?.role === ProjectRole.VIEWER && action === 'move') {
      return false;
    }

    return false;
  }

  private async reorderTasksInColumnHelper(queryRunner: any, columnId: number, movedTaskId: number, newOrder: number): Promise<void> {
    // Get all tasks in the column except the moved one
    const tasks = await queryRunner.manager.find(Task, {
      where: { columnId },
      order: { order: 'ASC' },
    });

    // Reorder tasks
    let order = 0;
    for (const task of tasks) {
      if (task.id !== movedTaskId) {
        if (order === newOrder) {
          order++; // Skip the position for the moved task
        }
        task.order = order;
        await queryRunner.manager.save(task);
        order++;
      }
    }
  }

  // ========== FILE ATTACHMENT METHODS ==========

  async uploadTaskAttachment(taskId: number, file: Express.Multer.File, userId: number): Promise<any> {
    const task = await this.getTaskById(taskId, userId);

    // Check if user can update task
    const canUpdate = await this.checkTaskPermission(task, userId, 'update');
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to upload files to this task');
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Upload file using FileUploadService
    const filePath = await this.fileUploadService.uploadTempFile(file);

    // Create attachment object
    const attachment = {
      filename: file.originalname,
      url: filePath,
      size: file.size,
      type: file.mimetype,
    };

    // Add attachment to task
    const attachments = task.attachments || [];
    attachments.push(attachment);

    // Update task with new attachment
    task.attachments = attachments;
    await this.taskRepository.save(task);

    // Log activity
    await this.activityService.logActivity(
      task.projectId,
      userId,
      ActivityType.FILE_UPLOADED,
      `File "${attachment.filename}" was uploaded to task "${task.title}"`,
      { 
        taskId: task.id,
        taskTitle: task.title,
        fileName: attachment.filename,
        fileSize: attachment.size,
        fileType: attachment.type,
      },
      'task',
      task.id,
    );

    // Send notification to assignees if file was uploaded
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      for (const assigneeId of task.assigneeIds) {
        if (assigneeId !== userId) {
          await this.notificationsService.createTaskFileUploadedNotification(
            assigneeId,
            task.id,
            userId,
            attachment.filename,
          );
        }
      }
    }

    return {
      attachment,
      message: 'File uploaded successfully',
    };
  }

  async deleteTaskAttachment(taskId: number, attachmentId: string, userId: number): Promise<{ message: string }> {
    const task = await this.getTaskById(taskId, userId);

    // Check if user can update task
    const canUpdate = await this.checkTaskPermission(task, userId, 'update');
    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to delete files from this task');
    }

    const attachments = task.attachments || [];
    const attachmentIndex = attachments.findIndex(att => att.filename === attachmentId);

    if (attachmentIndex === -1) {
      throw new NotFoundException('Attachment not found');
    }

    const attachment = attachments[attachmentIndex];

    // Delete file from filesystem
    try {
      await this.fileUploadService.deleteAvatar(attachment.url);
    } catch (error) {
      console.warn('Failed to delete file from filesystem:', error);
    }

    // Remove attachment from task
    attachments.splice(attachmentIndex, 1);
    task.attachments = attachments;
    await this.taskRepository.save(task);

    return { message: 'Attachment deleted successfully' };
  }
}

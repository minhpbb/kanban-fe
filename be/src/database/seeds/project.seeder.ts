import { DataSource } from 'typeorm';
import { User, Project, ProjectMember, KanbanBoard, KanbanColumn, Task } from '../../entities';
import { ProjectRole } from '../../entities/project-member.entity';
import * as bcrypt from 'bcryptjs';
import { ColumnColor, ColumnType } from '../../entities/kanban-column.entity';

export class ProjectSeeder {
  constructor(private dataSource: DataSource) {}

  async run() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Ensure admin user exists (from AuthSeeder)
      const adminUser = await queryRunner.manager.findOne(User, { where: { username: 'admin' } });

      if (!adminUser) {
        throw new Error('Admin user not found. Please run auth seeder first.');
      }

      // Create project owner user
      const ownerUser = await this.createOwnerUser(queryRunner);

      // Create 2 team members
      const member1 = await this.createMember1(queryRunner);
      const member2 = await this.createMember2(queryRunner);

      // Create project
      const project = await this.createProject(queryRunner, ownerUser);

      // Add 3 members to project: admin, owner, member1
      await this.addProjectMember(queryRunner, project, adminUser, ProjectRole.ADMIN);
      await this.addProjectMember(queryRunner, project, ownerUser, ProjectRole.ADMIN);
      await this.addProjectMember(queryRunner, project, member1, ProjectRole.MEMBER);

      // Create kanban board
      const board = await this.createKanbanBoard(queryRunner, project, ownerUser);

      // Create default columns
      const columns = await this.createDefaultColumns(queryRunner, board);

      // Create tasks in columns with assignments
      await this.createTasks(queryRunner, project, board, columns, ownerUser, [member1, member2]);

      await queryRunner.commitTransaction();
      console.log('Project seeding completed successfully');
      console.log('\n=== USER CREDENTIALS ===');
      console.log('Admin:');
      console.log('  Username: admin');
      console.log('  Password: admin@2025');
      console.log('  Email: admin@kanban.com');
      console.log('\nOwner:');
      console.log('  Username: owner');
      console.log('  Password: owner@2025');
      console.log('  Email: owner@kanban.com');
      console.log('  Full Name: Project Owner');
      console.log('\nMember 1:');
      console.log('  Username: member1');
      console.log('  Password: member1@2025');
      console.log('  Email: member1@kanban.com');
      console.log('  Full Name: John Developer');
      console.log('\nMember 2:');
      console.log('  Username: member2');
      console.log('  Password: member2@2025');
      console.log('  Email: member2@kanban.com');
      console.log('  Full Name: Jane Designer');
      console.log('\n=== PROJECT INFO ===');
      console.log(`Project: ${project.name} (ID: ${project.id})`);
      console.log('Members: admin, owner, member1');
      console.log('Board: Main Board with 4 default columns');
      console.log('Tasks: Assigned to member1 in various columns');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Project seeding failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createOwnerUser(queryRunner: any) {
    const hashedPassword = await bcrypt.hash('owner@2025', 12);

    const ownerUser = queryRunner.manager.create(User, {
      username: 'owner',
      email: 'owner@kanban.com',
      password: hashedPassword,
      fullName: 'Project Owner',
      isActive: true,
    });

    return await queryRunner.manager.save(ownerUser);
  }

  private async createMember1(queryRunner: any) {
    const hashedPassword = await bcrypt.hash('member1@2025', 12);

    const member1 = queryRunner.manager.create(User, {
      username: 'member1',
      email: 'member1@kanban.com',
      password: hashedPassword,
      fullName: 'John Developer',
      isActive: true,
    });

    return await queryRunner.manager.save(member1);
  }

  private async createMember2(queryRunner: any) {
    const hashedPassword = await bcrypt.hash('member2@2025', 12);

    const member2 = queryRunner.manager.create(User, {
      username: 'member2',
      email: 'member2@kanban.com',
      password: hashedPassword,
      fullName: 'Jane Designer',
      isActive: true,
    });

    return await queryRunner.manager.save(member2);
  }

  private async createProject(queryRunner: any, owner: User) {
    const project = queryRunner.manager.create(Project, {
      name: 'Sample Kanban Project',
      description: 'A sample project with admin, owner, and member collaboration.',
      ownerId: owner.id,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      settings: {
        allowGuestAccess: false,
        defaultTaskStatuses: ['To Do', 'In Progress', 'Review', 'Done'],
        taskLabels: ['setup', 'documentation', 'database', 'design', 'auth', 'security', 'api', 'backend', 'frontend', 'ui', 'feature', 'collaboration', 'files', 'notifications'],
      },
    });
    return await queryRunner.manager.save(project);
  }

  private async addProjectMember(queryRunner: any, project: Project, user: User, role: ProjectRole) {
    const projectMember = queryRunner.manager.create(ProjectMember, {
      projectId: project.id,
      userId: user.id,
      role: role,
      joinedAt: new Date(),
      isActive: true,
    });
    return await queryRunner.manager.save(projectMember);
  }

  private async createKanbanBoard(queryRunner: any, project: Project, createdBy: User) {
    const board = queryRunner.manager.create(KanbanBoard, {
      name: 'Main Board',
      description: 'The primary Kanban board for task management.',
      projectId: project.id,
      createdById: createdBy.id,
      isActive: true,
      settings: {
        allowColumnCreation: true,
        allowColumnDeletion: true,
        allowColumnReordering: true,
        defaultColumns: ['To Do', 'In Progress', 'Review', 'Done'],
        maxColumns: 10,
      },
    });
    return await queryRunner.manager.save(board);
  }

  private async createDefaultColumns(queryRunner: any, board: KanbanBoard) {
    const columnData = [
      { name: 'To Do', description: 'Tasks that are ready to be started.', type: ColumnType.SYSTEM, color: ColumnColor.BLUE, order: 1, maxTasks: 0, isActive: true, isWipLimit: false },
      { name: 'In Progress', description: 'Tasks currently being worked on.', type: ColumnType.SYSTEM, color: ColumnColor.YELLOW, order: 2, maxTasks: 0, isActive: true, isWipLimit: true, wipSettings: { limit: 3, warningThreshold: 2, color: 'orange' } },
      { name: 'Review', description: 'Tasks awaiting review or testing.', type: ColumnType.SYSTEM, color: ColumnColor.PURPLE, order: 3, maxTasks: 0, isActive: true, isWipLimit: true, wipSettings: { limit: 5, warningThreshold: 4, color: 'red' } },
      { name: 'Done', description: 'Completed tasks.', type: ColumnType.SYSTEM, color: ColumnColor.GREEN, order: 4, maxTasks: 0, isActive: true, isWipLimit: false },
    ];

    const columns: KanbanColumn[] = [];
    for (const data of columnData) {
      const column = queryRunner.manager.create(KanbanColumn, { ...data, boardId: board.id });
      columns.push(await queryRunner.manager.save(column));
    }

    return columns;
  }

  private async createTasks(queryRunner: any, project: Project, board: KanbanBoard, columns: KanbanColumn[], createdBy: User, teamMembers: User[]) {
    const todoColumn = columns.find(c => c.name === 'To Do');
    const inProgressColumn = columns.find(c => c.name === 'In Progress');
    const reviewColumn = columns.find(c => c.name === 'Review');
    const doneColumn = columns.find(c => c.name === 'Done');

    if (!todoColumn || !inProgressColumn || !reviewColumn || !doneColumn) {
      throw new Error('Required columns not found');
    }

    const [member1, member2] = teamMembers;

    const taskData = [
      // To Do Column - 2 tasks assigned to member1
      {
        title: 'Setup development environment',
        description: 'Configure development tools and environment for the project.',
        columnId: todoColumn.id,
        priority: 'high' as const,
        order: 1,
        assigneeIds: [member1.id],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        labels: ['setup', 'development'],
        timeTracking: {
          estimatedHours: 4,
        },
      },
      {
        title: 'Create project documentation',
        description: 'Write comprehensive project documentation and README.',
        columnId: todoColumn.id,
        priority: 'medium' as const,
        order: 2,
        assigneeIds: [member1.id],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        labels: ['documentation'],
        timeTracking: {
          estimatedHours: 6,
        },
      },

      // In Progress Column - 1 task assigned to member1
      {
        title: 'Implement user authentication',
        description: 'Create login, registration, and JWT token management system.',
        columnId: inProgressColumn.id,
        priority: 'high' as const,
        order: 1,
        assigneeIds: [member1.id],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        labels: ['auth', 'security'],
        timeTracking: {
          estimatedHours: 12,
          actualHours: 8,
          startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },

      // Review Column - 1 task assigned to member1
      {
        title: 'Design database schema',
        description: 'Create the database schema for users, projects, tasks, and kanban boards.',
        columnId: reviewColumn.id,
        priority: 'high' as const,
        order: 1,
        assigneeIds: [member1.id],
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        labels: ['database', 'design'],
        timeTracking: {
          estimatedHours: 8,
          actualHours: 6,
          startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      },

      // Done Column - 1 task assigned to member1
      {
        title: 'Project initialization',
        description: 'Initialize the project repository with proper structure.',
        columnId: doneColumn.id,
        priority: 'high' as const,
        order: 1,
        assigneeIds: [member1.id],
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        labels: ['setup', 'initialization'],
        timeTracking: {
          estimatedHours: 2,
          actualHours: 1.5,
          startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      },

      // Additional tasks with multiple assignees
      {
        title: 'Code review and testing',
        description: 'Review code changes and perform comprehensive testing.',
        columnId: reviewColumn.id,
        priority: 'medium' as const,
        order: 2,
        assigneeIds: [member1.id, member2.id], // Multiple assignees
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        labels: ['review', 'testing'],
        timeTracking: {
          estimatedHours: 6,
        },
      },
      {
        title: 'Frontend and backend integration',
        description: 'Integrate frontend components with backend APIs.',
        columnId: inProgressColumn.id,
        priority: 'high' as const,
        order: 2,
        assigneeIds: [member1.id, member2.id], // Multiple assignees
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        labels: ['integration', 'frontend', 'backend'],
        timeTracking: {
          estimatedHours: 10,
          actualHours: 3,
          startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      },
    ];

    for (const data of taskData) {
      const task = queryRunner.manager.create(Task, {
        ...data,
        projectId: project.id,
        boardId: board.id,
        createdById: createdBy.id,
      });
      await queryRunner.manager.save(task);
    }
  }
}

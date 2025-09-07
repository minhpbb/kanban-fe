import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from '../entities/project.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { User } from '../entities/user.entity';
import { KanbanBoard } from '../entities/kanban-board.entity';
import { KanbanColumn } from '../entities/kanban-column.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, User, KanbanBoard, KanbanColumn]),
    NotificationsModule,
    CommonModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
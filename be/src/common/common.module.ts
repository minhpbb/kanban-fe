import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../entities/user.entity';
import { ActivityService } from './services/activity.service';
import { FileUploadService } from './services/file-upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog, User]),
  ],
  providers: [ActivityService, FileUploadService],
  exports: [ActivityService, FileUploadService],
})
export class CommonModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { Action } from '../entities/action.entity';
import { Module as ModuleEntity } from '../entities/module.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionGuard } from './guards/permission.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      ModuleEntity,
      Action,
      UserRole,
      RolePermission,
      RefreshToken,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionGuard],
  exports: [AuthService, JwtStrategy, PermissionGuard],
})
export class AuthModule {}

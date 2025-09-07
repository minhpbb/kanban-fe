import { Controller, Get, Query, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permission.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @RequirePermissions('user:read')
  @ApiOperation({
    summary: 'Search users',
    description: 'Search users by name, username, or email'
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (name, username, or email)',
    required: true,
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: [
          {
            id: 1,
            username: 'john_doe',
            email: 'john@example.com',
            fullName: 'John Doe',
            avatar: null,
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async searchUsers(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const users = await this.usersService.searchUsers(query.trim());
    return users;
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get user details by user ID'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    schema: {
      example: {
        errCode: 'E000',
        reason: 'Success',
        result: 'SUCCESS',
        data: {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          fullName: 'John Doe',
          avatar: null,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    return user;
  }
}
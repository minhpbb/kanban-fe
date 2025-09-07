import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async searchUsers(query: string): Promise<User[]> {
    const searchPattern = `%${query}%`;
    
    return await this.userRepository.find({
      where: [
        { fullName: Like(searchPattern) },
        { username: Like(searchPattern) },
        { email: Like(searchPattern) },
      ],
      select: [
        'id',
        'username',
        'email',
        'fullName',
        'avatar',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      take: 20, // Limit results
      order: {
        fullName: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'fullName',
        'avatar',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }
}
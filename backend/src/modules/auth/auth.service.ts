import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<User | null> {
    const cleanIdentifier = (identifier || '').trim();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :identifier OR user.phone = :rawIdentifier', {
        identifier: cleanIdentifier.toLowerCase(),
        rawIdentifier: cleanIdentifier,
      })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result as User;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email, phone or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, memberId: user.memberId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        memberId: user.memberId,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: [{ email: registerDto.email.toLowerCase() }, { phone: registerDto.phone }],
    });

    if (existing) {
      throw new ConflictException('A user with this email or phone already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email.toLowerCase(),
      phone: registerDto.phone,
      passwordHash,
      role: registerDto.role || Role.COLLECTION_STAFF,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    const payload = { sub: saved.id, email: saved.email, role: saved.role };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        role: saved.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}

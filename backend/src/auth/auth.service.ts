import { Injectable, ConflictException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const adminEmail = 'admin@entwoh.com';
    const adminExists = await this.userRepository.findOne({ where: { email: adminEmail } });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const admin = this.userRepository.create({
        email: adminEmail,
        passwordHash,
        name: 'Platform Administrator',
        role: UserRole.ADMIN,
      });
      await this.userRepository.save(admin);
      console.log('✅ Default Admin seeded successfully: admin@entwoh.com / admin123');
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      passwordHash,
      name,
      role: UserRole.CUSTOMER,
    });
    const savedUser = await this.userRepository.save(user);
    const token = this.generateToken(savedUser);
    return {
      accessToken: token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}

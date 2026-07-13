import { Injectable, ConflictException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new ConflictException('User with this email does not exist');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetPasswordCode = code;
    user.resetPasswordExpires = expires;
    await this.userRepository.save(user);

    const { sendResetCodeEmail } = require('./mailer.helper');
    await sendResetCodeEmail(user.email, user.name, code);

    return { message: 'Verification code sent to your email.' };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new ConflictException('User not found');
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return { message: 'Password has been reset successfully.' };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}

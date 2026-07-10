import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: { id: 'user-id', email: 'test@example.com', name: 'Test User' },
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      (authService.register as jest.Mock).mockResolvedValue(mockTokens);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      (authService.login as jest.Mock).mockResolvedValue(mockTokens);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken and return the result', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'some-refresh-token' };
      (authService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      const result = await controller.refresh(dto);

      expect(authService.refreshToken).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(mockTokens);
    });
  });
});

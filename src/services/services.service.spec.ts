import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';

describe('ServicesService', () => {
  let service: ServicesService;
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '660e8400-e29b-41d4-a716-446655440001';

  const mockService: Service = {
    id: '770e8400-e29b-41d4-a716-446655440002',
    title: 'Haircut Premium',
    description: 'A premium haircut service',
    duration: 60,
    price: 49.99,
    isActive: true,
    userId,
    user: null as any,
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const inactiveService: Service = {
    ...mockService,
    id: '880e8400-e29b-41d4-a716-446655440003',
    isActive: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  describe('create', () => {
    it('should create a service', async () => {
      const dto = {
        title: 'Haircut Premium',
        description: 'A premium haircut service',
        duration: 60,
        price: 49.99,
      };
      mockRepository.create.mockReturnValue(mockService);
      mockRepository.save.mockResolvedValue(mockService);

      const result = await service.create(dto, userId);

      expect(mockRepository.create).toHaveBeenCalledWith({ ...dto, userId });
      expect(mockRepository.save).toHaveBeenCalledWith(mockService);
      expect(result).toEqual(mockService);
    });
  });

  describe('findAll', () => {
    it('should return only active services by default', async () => {
      mockRepository.find.mockResolvedValue([mockService]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockService]);
    });

    it('should filter by isActive when provided', async () => {
      mockRepository.find.mockResolvedValue([inactiveService]);

      const result = await service.findAll({ isActive: false });

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: false } }),
      );
      expect(result).toEqual([inactiveService]);
    });

    it('should search by title', async () => {
      mockRepository.find.mockResolvedValue([mockService]);

      const result = await service.findAll({ search: 'Haircut' });

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ title: expect.any(Object) }),
        }),
      );
      expect(result).toEqual([mockService]);
    });
  });

  describe('findById', () => {
    it('should return a service when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockService);

      const result = await service.findById(mockService.id);

      expect(result).toEqual(mockService);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update own service', async () => {
      const updateDto = { title: 'Updated Title' };
      mockRepository.findOne.mockResolvedValue(mockService);
      mockRepository.save.mockResolvedValue({ ...mockService, ...updateDto });

      const result = await service.update(mockService.id, updateDto, userId);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException when not the owner', async () => {
      mockRepository.findOne.mockResolvedValue(mockService);

      await expect(
        service.update(mockService.id, { title: 'Hacked' }, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when service not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { title: 'New' }, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete own service', async () => {
      mockRepository.findOne.mockResolvedValue(mockService);
      mockRepository.save.mockResolvedValue({ ...mockService, isActive: false });

      await service.softDelete(mockService.id, userId);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw ForbiddenException when not the owner', async () => {
      mockRepository.findOne.mockResolvedValue(mockService);

      await expect(
        service.softDelete(mockService.id, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete own service', async () => {
      mockRepository.findOne.mockResolvedValue(mockService);
      mockRepository.remove.mockResolvedValue(mockService);

      await service.hardDelete(mockService.id, userId);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockService);
    });

    it('should throw ForbiddenException when not the owner', async () => {
      mockRepository.findOne.mockResolvedValue(mockService);

      await expect(
        service.hardDelete(mockService.id, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

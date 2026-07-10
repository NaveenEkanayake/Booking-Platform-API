import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';

describe('ServicesController', () => {
  let controller: ServicesController;
  let servicesService: jest.Mocked<Partial<ServicesService>>;

  const mockUser = { id: 'user-id' };
  const mockService = {
    id: 'service-id',
    title: 'Haircut',
    description: 'A haircut',
    duration: 60,
    price: 49.99,
    isActive: true,
    userId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    servicesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: servicesService }],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  describe('create', () => {
    it('should create a service', async () => {
      const dto: CreateServiceDto = {
        title: 'Haircut',
        description: 'A haircut',
        duration: 60,
        price: 49.99,
      };
      (servicesService.create as jest.Mock).mockResolvedValue(mockService);

      const result = await controller.create(dto, mockUser);

      expect(servicesService.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(mockService);
    });
  });

  describe('findAll', () => {
    it('should return all services with query', async () => {
      const query: ServiceQueryDto = { search: 'Haircut' };
      (servicesService.findAll as jest.Mock).mockResolvedValue([mockService]);

      const result = await controller.findAll(query);

      expect(servicesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockService]);
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      (servicesService.findById as jest.Mock).mockResolvedValue(mockService);

      const result = await controller.findOne('service-id');

      expect(servicesService.findById).toHaveBeenCalledWith('service-id');
      expect(result).toEqual(mockService);
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const dto: UpdateServiceDto = { title: 'Updated' };
      (servicesService.update as jest.Mock).mockResolvedValue({
        ...mockService,
        ...dto,
      });

      const result = await controller.update('service-id', dto, mockUser);

      expect(servicesService.update).toHaveBeenCalledWith('service-id', dto, mockUser.id);
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should soft delete a service', async () => {
      (servicesService.softDelete as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.remove('service-id', mockUser);

      expect(servicesService.softDelete).toHaveBeenCalledWith('service-id', mockUser.id);
      expect(result).toEqual({ message: 'Service deactivated successfully' });
    });
  });
});

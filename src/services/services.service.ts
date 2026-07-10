import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    userId: string,
  ): Promise<Service> {
    const service = this.servicesRepository.create({
      ...createServiceDto,
      userId,
    });
    return this.servicesRepository.save(service);
  }

  async findAll(query?: ServiceQueryDto): Promise<Service[]> {
    const where: any = {};

    // Public endpoint: only show active services
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    } else {
      where.isActive = true;
    }

    if (query?.search) {
      where.title = Like(`%${query.search}%`);
    }

    return this.servicesRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByUser(userId: string): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId: string,
  ): Promise<Service> {
    const service = await this.findById(id);

    if (service.userId !== userId) {
      throw new ForbiddenException(
        'You can only update your own services',
      );
    }

    Object.assign(service, updateServiceDto);
    return this.servicesRepository.save(service);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const service = await this.findById(id);

    if (service.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own services',
      );
    }

    service.isActive = false;
    await this.servicesRepository.save(service);
  }

  async hardDelete(id: string, userId: string): Promise<void> {
    const service = await this.findById(id);

    if (service.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own services',
      );
    }

    await this.servicesRepository.remove(service);
  }
}

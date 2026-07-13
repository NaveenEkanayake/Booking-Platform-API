import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { ServiceEntity } from '../services/service.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  async create(createBookingDto: CreateBookingDto, customerId?: string): Promise<Booking> {
    const { serviceId, bookingDate, bookingTime } = createBookingDto;

    // 1. Service must exist and be active
    const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }
    if (!service.isActive) {
      throw new BadRequestException('Cannot book an inactive service');
    }

    // 2. Booking date cannot be in past
    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingDate < todayStr) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // 3. Prevent double booking for same service+date+time where status=CONFIRMED
    const doubleBooked = await this.bookingRepository.findOne({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: BookingStatus.CONFIRMED,
      },
    });
    if (doubleBooked) {
      throw new ConflictException('This time slot is already booked and confirmed');
    }

    // Create booking
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      customerId: customerId || null,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  async findAll(query: BookingQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .orderBy('booking.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(booking.customerName LIKE :search OR booking.customerEmail LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['service'],
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Admins can see any booking, Customers can only see their own
    if (user.role !== 'ADMIN' && booking.customerId !== user.id) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async findMyBookings(customerId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { customerId },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelMyBooking(id: string, customerId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id, customerId } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found for this customer`);
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }

  async updateStatus(id: string, updateStatusDto: UpdateBookingStatusDto): Promise<Booking> {
    const { status: newStatus } = updateStatusDto;
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Business Rules validation
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot change status of a cancelled booking');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot change status of a completed booking');
    }

    // Double booking check if status changes to CONFIRMED
    if (newStatus === BookingStatus.CONFIRMED) {
      const doubleBooked = await this.bookingRepository.findOne({
        where: {
          serviceId: booking.serviceId,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          status: BookingStatus.CONFIRMED,
        },
      });
      if (doubleBooked && doubleBooked.id !== booking.id) {
        throw new ConflictException('This time slot is already booked and confirmed');
      }
    }

    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }
}

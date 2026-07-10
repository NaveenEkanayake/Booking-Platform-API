import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate service exists and is active
    const service = await this.servicesRepository.findOne({
      where: { id: createBookingDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.isActive) {
      throw new BadRequestException('Service is no longer active');
    }

    // Validate booking date is in the future
    const bookingDate = new Date(createBookingDto.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate <= today) {
      throw new BadRequestException('Booking date must be in the future');
    }

    // Duplicate prevention: check for existing booking with same service, date, and time
    const existingBooking = await this.bookingsRepository.findOne({
      where: {
        serviceId: createBookingDto.serviceId,
        bookingDate: createBookingDto.bookingDate,
        bookingTime: createBookingDto.bookingTime,
        status: BookingStatus.PENDING,
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'A booking already exists for this service at the same date and time',
      );
    }

    const booking = this.bookingsRepository.create(createBookingDto);
    return this.bookingsRepository.save(booking);
  }

  async findAll(query: BookingQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.customerName = Like(`%${query.search}%`);
    }

    if (query.status) {
      where.status = query.status;
    }

    const [bookings, total] = await this.bookingsRepository.findAndCount({
      where,
      relations: ['service'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['service'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.findById(id);
    const newStatus = updateStatusDto.status;

    // Validate status transitions
    this.validateStatusTransition(booking.status, newStatus);

    booking.status = newStatus;
    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findById(id);

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot cancel a completed booking',
      );
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }

  private validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
  ): void {
    // Cannot change a CANCELLED booking
    if (currentStatus === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot change status of a cancelled booking',
      );
    }

    // Cannot change a COMPLETED booking
    if (currentStatus === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot change status of a completed booking',
      );
    }

    // CANCELLED from any status except COMPLETED is allowed
    if (newStatus === BookingStatus.CANCELLED) {
      return;
    }

    // Valid transitions: PENDING → CONFIRMED, CONFIRMED → COMPLETED
    if (
      (currentStatus === BookingStatus.PENDING &&
        newStatus === BookingStatus.CONFIRMED) ||
      (currentStatus === BookingStatus.CONFIRMED &&
        newStatus === BookingStatus.COMPLETED)
    ) {
      return;
    }

    // If we got here, the transition is invalid
    throw new BadRequestException(
      `Cannot transition from ${currentStatus} to ${newStatus}. ` +
        `Valid transitions: PENDING → CONFIRMED → COMPLETED, or any status → CANCELLED`,
    );
  }
}

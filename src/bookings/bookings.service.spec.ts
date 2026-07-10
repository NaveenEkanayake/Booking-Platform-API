import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';

describe('BookingsService', () => {
  let service: BookingsService;
  let mockBookingRepo: any;
  let mockServiceRepo: any;

  const activeService: Service = {
    id: 'service-id',
    title: 'Haircut',
    description: 'A haircut',
    duration: 60,
    price: 49.99,
    isActive: true,
    userId: 'user-id',
    user: null as any,
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const inactiveService: Service = {
    ...activeService,
    isActive: false,
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const mockBooking: Booking = {
    id: 'booking-id',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '+1234567890',
    serviceId: 'service-id',
    service: null as any,
    bookingDate: tomorrowStr,
    bookingTime: '14:30',
    status: BookingStatus.PENDING,
    notes: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const confirmedBooking: Booking = {
    ...mockBooking,
    id: 'confirmed-id',
    status: BookingStatus.CONFIRMED,
  };

  const completedBooking: Booking = {
    ...mockBooking,
    id: 'completed-id',
    status: BookingStatus.COMPLETED,
  };

  const cancelledBooking: Booking = {
    ...mockBooking,
    id: 'cancelled-id',
    status: BookingStatus.CANCELLED,
  };

  beforeEach(async () => {
    mockBookingRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    mockServiceRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(Service), useValue: mockServiceRepo },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      const dto = {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service-id',
        bookingDate: tomorrowStr,
        bookingTime: '14:30',
      };

      mockServiceRepo.findOne.mockResolvedValue(activeService);
      mockBookingRepo.findOne.mockResolvedValue(null);
      mockBookingRepo.create.mockReturnValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue(mockBooking);

      const result = await service.create(dto);

      expect(mockServiceRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.serviceId },
      });
      expect(mockBookingRepo.findOne).toHaveBeenCalledWith({
        where: {
          serviceId: dto.serviceId,
          bookingDate: dto.bookingDate,
          bookingTime: dto.bookingTime,
          status: BookingStatus.PENDING,
        },
      });
      expect(mockBookingRepo.create).toHaveBeenCalledWith(dto);
      expect(mockBookingRepo.save).toHaveBeenCalledWith(mockBooking);
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockServiceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: '+1234567890',
          serviceId: 'nonexistent-service',
          bookingDate: tomorrowStr,
          bookingTime: '14:30',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when service is inactive', async () => {
      mockServiceRepo.findOne.mockResolvedValue(inactiveService);

      await expect(
        service.create({
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: '+1234567890',
          serviceId: 'service-id',
          bookingDate: tomorrowStr,
          bookingTime: '14:30',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when booking date is in the past', async () => {
      mockServiceRepo.findOne.mockResolvedValue(activeService);

      await expect(
        service.create({
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          customerPhone: '+1234567890',
          serviceId: 'service-id',
          bookingDate: yesterdayStr,
          bookingTime: '14:30',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when duplicate booking exists', async () => {
      const dto = {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service-id',
        bookingDate: tomorrowStr,
        bookingTime: '14:30',
      };

      mockServiceRepo.findOne.mockResolvedValue(activeService);
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings', async () => {
      const bookings = [mockBooking];
      mockBookingRepo.findAndCount.mockResolvedValue([bookings, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: bookings,
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('should filter by status', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[confirmedBooking], 1]);

      const result = await service.findAll({ status: BookingStatus.CONFIRMED });

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: BookingStatus.CONFIRMED },
        }),
      );
      expect(result.data).toEqual([confirmedBooking]);
    });

    it('should search by customer name', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[mockBooking], 1]);

      await service.findAll({ search: 'Jane' });

      expect(mockBookingRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerName: expect.any(Object) },
        }),
      );
    });

    it('should handle empty results', async () => {
      mockBookingRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a booking when found', async () => {
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);

      const result = await service.findById('booking-id');

      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException when not found', async () => {
      mockBookingRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should transition PENDING to CONFIRMED', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...mockBooking }),
      );
      mockBookingRepo.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.updateStatus('booking-id', {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should transition CONFIRMED to COMPLETED', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...confirmedBooking }),
      );
      mockBookingRepo.save.mockResolvedValue({
        ...confirmedBooking,
        status: BookingStatus.COMPLETED,
      });

      const result = await service.updateStatus('confirmed-id', {
        status: BookingStatus.COMPLETED,
      });

      expect(result.status).toBe(BookingStatus.COMPLETED);
    });

    it('should transition PENDING to CANCELLED', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...mockBooking }),
      );
      mockBookingRepo.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.updateStatus('booking-id', {
        status: BookingStatus.CANCELLED,
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException when changing CANCELLED booking', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...cancelledBooking }),
      );

      await expect(
        service.updateStatus('cancelled-id', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when changing COMPLETED booking', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...completedBooking }),
      );

      await expect(
        service.updateStatus('completed-id', { status: BookingStatus.CANCELLED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid transition PENDING to COMPLETED', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...mockBooking }),
      );

      await expect(
        service.updateStatus('booking-id', { status: BookingStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid transition CONFIRMED to PENDING', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...confirmedBooking }),
      );

      await expect(
        service.updateStatus('confirmed-id', { status: BookingStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a PENDING booking', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...mockBooking }),
      );
      mockBookingRepo.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel('booking-id');

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should cancel a CONFIRMED booking', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...confirmedBooking }),
      );
      mockBookingRepo.save.mockResolvedValue({
        ...confirmedBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel('confirmed-id');

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException when cancelling a COMPLETED booking', async () => {
      mockBookingRepo.findOne.mockImplementation(() =>
        Promise.resolve({ ...completedBooking }),
      );

      await expect(service.cancel('completed-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingStatus } from './entities/booking.entity';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: jest.Mocked<Partial<BookingsService>>;

  const mockBooking = {
    id: 'booking-id',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '+1234567890',
    serviceId: 'service-id',
    bookingDate: '2026-07-15',
    bookingTime: '14:30',
    status: BookingStatus.PENDING,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    bookingsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingsService }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const dto: CreateBookingDto = {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+1234567890',
        serviceId: 'service-id',
        bookingDate: '2026-07-15',
        bookingTime: '14:30',
      };
      (bookingsService.create as jest.Mock).mockResolvedValue(mockBooking);

      const result = await controller.create(dto);

      expect(bookingsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockBooking);
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings', async () => {
      const paginatedResult = {
        data: [mockBooking],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      const query: BookingQueryDto = { page: 1, limit: 10 };
      (bookingsService.findAll as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(bookingsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      (bookingsService.findById as jest.Mock).mockResolvedValue(mockBooking);

      const result = await controller.findOne('booking-id');

      expect(bookingsService.findById).toHaveBeenCalledWith('booking-id');
      expect(result).toEqual(mockBooking);
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      const dto: UpdateBookingStatusDto = { status: BookingStatus.CONFIRMED };
      (bookingsService.updateStatus as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await controller.updateStatus('booking-id', dto);

      expect(bookingsService.updateStatus).toHaveBeenCalledWith('booking-id', dto);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      (bookingsService.cancel as jest.Mock).mockResolvedValue(cancelledBooking);

      const result = await controller.cancel('booking-id');

      expect(bookingsService.cancel).toHaveBeenCalledWith('booking-id');
      expect(result).toEqual({
        message: 'Booking cancelled successfully',
        booking: cancelledBooking,
      });
    });
  });
});

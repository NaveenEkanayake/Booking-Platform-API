import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a booking (Guest or Authenticated Customer)' })
  @ApiResponse({ status: 201, description: 'Booking successfully submitted' })
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: Request) {
    let customerId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'fallback-secret-key-12345';
        const decoded = this.jwtService.verify(token, { secret });
        customerId = decoded.sub;
      } catch (err) {
        // Fall back to guest if token is invalid
      }
    }
    return this.bookingsService.create(createBookingDto, customerId);
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'View personal booking history (Customer only)' })
  async findMyBookings(@Req() req: any) {
    return this.bookingsService.findMyBookings(req.user.id);
  }

  @Patch(':id/cancel-my-booking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel own booking (Customer only)' })
  async cancelMyBooking(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.cancelMyBooking(id, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Master Booking Board (Admin only)' })
  async findAll(@Query() query: BookingQueryDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CUSTOMER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get booking by ID (Admin or matching Customer)' })
  @ApiResponse({ status: 200, description: 'Return the booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.findOne(id, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update booking status (Admin only)' })
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, updateStatusDto);
  }
}

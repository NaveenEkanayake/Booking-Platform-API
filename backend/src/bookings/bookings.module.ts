import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { ServiceEntity } from '../services/service.entity';
import { AuthModule } from '../auth/auth.module';

import { BookingsGateway } from './bookings.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, ServiceEntity]),
    AuthModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsGateway],
  exports: [BookingsService, BookingsGateway],
})
export class BookingsModule {}

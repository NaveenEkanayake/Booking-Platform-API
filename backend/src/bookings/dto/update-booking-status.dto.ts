import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../booking.entity';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED })
  @IsEnum(BookingStatus, { message: 'Invalid booking status' })
  status: BookingStatus;

  @ApiProperty({ example: 'Customer called to cancel', required: false })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}

import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsDateString,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'Jane Smith',
  })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'jane.smith@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  customerEmail: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone is required' })
  customerPhone: string;

  @ApiProperty({
    description: 'Service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Invalid service ID format' })
  serviceId: string;

  @ApiProperty({
    description: 'Booking date',
    example: '2026-07-15',
  })
  @IsDateString({}, { message: 'Invalid date format' })
  bookingDate: string;

  @ApiProperty({
    description: 'Booking time (HH:mm format)',
    example: '14:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format',
  })
  bookingTime: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Please arrive 10 minutes early',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

import { IsNotEmpty, IsString, IsEmail, IsUUID, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'Alice Smith' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  customerEmail: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: '2026-07-20' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  bookingDate: string;

  @ApiProperty({ example: '14:30' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Time must be in HH:MM format' })
  bookingTime: string;

  @ApiProperty({ example: 'Additional requests...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

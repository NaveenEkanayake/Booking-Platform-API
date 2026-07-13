import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelBookingDto {
  @ApiProperty({ example: 'Change of plans', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cancellationReason?: string;
}

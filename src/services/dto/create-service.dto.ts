import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service title',
    example: 'Haircut Premium',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'A premium haircut service including wash and styling',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 60,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration: number;

  @ApiProperty({
    description: 'Service price',
    example: 49.99,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    default: true,
  })
  @IsOptional()
  isActive?: boolean;
}

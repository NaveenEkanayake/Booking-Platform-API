import { IsNotEmpty, IsString, IsInt, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Haircut' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Standard haircut services', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @Min(0)
  price: number;
}

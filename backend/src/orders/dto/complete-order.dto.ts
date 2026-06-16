import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CompleteOrderDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

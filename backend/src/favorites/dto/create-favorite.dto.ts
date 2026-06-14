import { IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsUUID()
  vendorId!: string;
}

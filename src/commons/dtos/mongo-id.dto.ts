import { IsMongoId } from 'class-validator';

export class MongoIdDto {
  @IsMongoId({ message: 'Invalid ID format' })
  id: string;
}
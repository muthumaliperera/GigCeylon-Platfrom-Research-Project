import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ContactMethod, JobCategory, PaymentType, Urgency } from '../schemas/job.schema';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsEnum(JobCategory)
  category: JobCategory;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsString()
  specificArea: string;

  @IsNotEmpty()
  @IsString()
  expectedDuration: string;

  @IsDateString()
  completionDeadline: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsNumber()
  @Min(0)
  paymentAmount: number;

  @IsNotEmpty()
  @IsString()
  basicRequirements: string;

  @IsNotEmpty()
  @IsString()
  whatYouProvide: string;

  @IsEnum(ContactMethod)
  preferredContactMethod: ContactMethod;

  @IsEnum(Urgency)
  urgency: Urgency;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
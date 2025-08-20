import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ContactMethod, JobType, PaymentType, Urgency } from '../schemas/job.schema';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsString()
  specificArea: string;

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

  @IsOptional()
  @IsString()
  whatYouProvide?: string;

  @IsEnum(ContactMethod)
  preferredContactMethod: ContactMethod;

  @IsEnum(Urgency)
  urgency: Urgency;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
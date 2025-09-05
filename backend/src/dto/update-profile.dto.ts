import { IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../schemas/user.schema';

class LanguageOtherDto {
  @IsString() name: string;
  @IsNumber() @Min(0) @Max(10) level: number;
}

class LanguagesDto {
  @IsOptional() @IsNumber() @Min(0) @Max(10) sinhala?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10) tamil?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10) english?: number;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => LanguageOtherDto) other?: LanguageOtherDto[];
}

class TimeRangeDto { @IsString() start: string; @IsString() end: string; }

class WorkingHoursSingleDto { @ValidateNested() @Type(() => TimeRangeDto) single!: TimeRangeDto; }

class WorkingHoursWeeklyDayDto {
  @IsIn(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']) day: string;
  @ValidateNested({ each: true }) @Type(() => TimeRangeDto) ranges: TimeRangeDto[];
}
class WorkingHoursWeeklyDto { @ValidateNested({ each: true }) @Type(() => WorkingHoursWeeklyDayDto) days: WorkingHoursWeeklyDayDto[]; }

class WorkingHoursDto {
  @IsIn(['single','weekly']) mode: 'single' | 'weekly';
  @IsOptional() @ValidateNested() @Type(() => TimeRangeDto) single?: TimeRangeDto;
  @IsOptional() @ValidateNested() @Type(() => WorkingHoursWeeklyDto) weekly?: WorkingHoursWeeklyDto;
}

class RateDto {
  @IsNumber() amount: number;
  @IsIn(['hour','day','week','month']) unit: 'hour'|'day'|'week'|'month';
  @IsIn(['LKR']) currency: 'LKR';
}

class DocumentDto {
  @IsString() url: string;
  @IsString() filename: string;
  @IsIn(['cv','certificate','other']) type: 'cv'|'certificate'|'other';
}

export class UpdateProfileDto {
  // base
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsString() profilePhotoUrl?: string;
  @IsOptional() @ValidateNested() @Type(() => LanguagesDto) languages?: LanguagesDto;

  // seeker
  @IsOptional() @ValidateNested() @Type(() => WorkingHoursDto) workingHours?: WorkingHoursDto;
  @IsOptional() @ValidateNested() @Type(() => RateDto) rate?: RateDto;
  @IsOptional() @IsArray() @IsString({ each: true }) jobTitles?: string[];
  @IsOptional() @IsString() bio?: string; // sanitized HTML
  @IsOptional() @IsArray() @IsString({ each: true }) services?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => DocumentDto) documents?: DocumentDto[];

  // connector
  @IsOptional() @IsString() connectorBio?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) servicesLookingFor?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) skillsLookingFor?: string[];
}

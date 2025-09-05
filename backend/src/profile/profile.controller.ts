import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { UserRole } from '../schemas/user.schema';

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMine(@Request() req) {
    return await this.service.getOrCreateMine(req.user._id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Request() req, @Body() dto: UpdateProfileDto) {
    return await this.service.updateMine(req.user._id, req.user.role, dto);
  }

  @Post('documents/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string = 'cv'
  ) {
    return await this.service.uploadDocument(req.user._id, file, documentType);
  }

  @Put('documents')
  @UseGuards(JwtAuthGuard)
  async saveDocuments(@Request() req, @Body('documents') documents: any[]) {
    return await this.service.saveDocuments(req.user._id, documents);
  }

  @Delete('documents')
  @UseGuards(JwtAuthGuard)
  async deleteDocument(@Request() req, @Body('documentUrl') documentUrl: string) {
    return await this.service.deleteDocument(req.user._id, documentUrl);
  }
}

@Controller('profiles')
export class ProfilesPublicController {
  constructor(private readonly service: ProfileService) {}

  // Public profile by user id
  @Get(':userId/public')
  async getPublic(@Param('userId') userId: string) {
    return await this.service.getPublicByUserId(userId);
  }

  // List public profiles; admin can view all roles; others can filter as needed
  @Get('public')
  @UseGuards(JwtAuthGuard)
  async listPublic(
    @Request() req,
    @Query('role') role?: UserRole,
    @Query('q') q?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // Admin can view all; for non-admin we still return public-safe data only
    return await this.service.listPublic(role, q, +page, +limit);
  }
}

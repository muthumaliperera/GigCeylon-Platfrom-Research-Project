import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe, Res } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { UserRole } from '../schemas/user.schema';
import type { Response } from 'express';

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
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/png'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Only PDF or PNG files are allowed') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @Request() req,
    @UploadedFile() file: any,
    @Body('documentType') documentType: string = 'cv'
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const isPdf = file.mimetype === 'application/pdf';
    const isPng = file.mimetype === 'image/png';
    if (!isPdf && !isPng) {
      throw new BadRequestException('Only PDF or PNG files are allowed');
    }
    const size = Number(file.size || 0);
    if (isPdf && size > 5 * 1024 * 1024) {
      throw new BadRequestException('PDF size must be 5MB or less');
    }
    if (isPng && size > 3 * 1024 * 1024) {
      throw new BadRequestException('PNG size must be 3MB or less');
    }
    // Ensure a profile exists for this user before attempting to save documents
    await this.service.getOrCreateMine(req.user._id);
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

  // Stream a specific document with correct headers so browser shows original filename
  @Get('documents/:index/view')
  @UseGuards(JwtAuthGuard)
  async viewDocument(
    @Request() req,
    @Param('index') indexStr: string,
    @Res() res: Response,
  ) {
    const index = Number(indexStr);
    if (!Number.isInteger(index) || index < 0) {
      throw new BadRequestException('Invalid document index');
    }
    const profile = await this.service.getOrCreateMine(req.user._id);
    const docs = (profile as any)?.seeker?.documents || [];
    const doc = docs[index];
    if (!doc) throw new BadRequestException('Document not found');
    const url: string = doc.url;
    if (!url || !url.startsWith('data:')) {
      // If it's an external URL, redirect
      return res.redirect(url);
    }
    const [header, base64] = url.split(',');
    const m = /^data:([^;]+);base64$/i.exec(header || '');
    const mime = m ? m[1] : 'application/octet-stream';
    const buffer = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', mime);
    const safeName = String(doc.filename || 'document').replace(/"/g, '');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.send(buffer);
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

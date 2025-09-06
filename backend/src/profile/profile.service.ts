import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from '../schemas/profile.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { UpdateProfileDto } from '../dto/update-profile.dto';

function sanitizeHtml(input?: string): string | undefined {
  if (!input) return input;
  // Very basic sanitizer: strip script/style tags and event handlers.
  let out = input.replace(/<\/(?:script|style)>/gi, '')
                 .replace(/<(script|style)[^>]*>[\s\S]*?<\/(script|style)>/gi, '')
                 .replace(/ on[a-z]+="[^"]*"/gi, '')
                 .replace(/ on[a-z]+='[^']*'/gi, '')
                 .replace(/ javascript:/gi, '');
  return out;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getOrCreateMine(userId: string) {
    const id = new Types.ObjectId(userId);
    let profile = await this.profileModel.findOne({ userId: id });
    if (!profile) {
      const user = await this.userModel.findById(id);
      if (!user) throw new NotFoundException('User not found');
      profile = await this.profileModel.create({
        userId: id,
        role: user.role,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
      });
    }
    return profile.toObject();
  }

  async updateMine(userId: string, role: UserRole, dto: UpdateProfileDto) {
    const id = new Types.ObjectId(userId);

    // Build update object whitelisting fields
    const update: any = {};

    if (dto.fullName !== undefined) update.fullName = dto.fullName;
    if (dto.email !== undefined) update.email = dto.email;
    if (dto.role !== undefined) update.role = dto.role; // rarely changed
    if (dto.profilePhotoUrl !== undefined) update.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.languages !== undefined) update.languages = dto.languages;

    if (role === UserRole.JOB_SEEKER) {
      update.seeker = update.seeker || {};
      if (dto.workingHours !== undefined) update.seeker.workingHours = dto.workingHours;
      if (dto.rate !== undefined) update.seeker.rate = dto.rate;
      if (dto.jobTitles !== undefined) update.seeker.jobTitles = dto.jobTitles;
      if (dto.bio !== undefined) update.seeker.bio = sanitizeHtml(dto.bio);
      if (dto.services !== undefined) update.seeker.services = dto.services;
      if (dto.skills !== undefined) update.seeker.skills = dto.skills;
      // Documents are handled separately via saveDocuments endpoint
      // Ensure connector subdoc not unintentionally overwritten
    }

    if (role === UserRole.TALENT_CONNECTOR) {
      update.connector = update.connector || {};
      if (dto.connectorBio !== undefined) update.connector.bio = sanitizeHtml(dto.connectorBio);
      if (dto.servicesLookingFor !== undefined) update.connector.servicesLookingFor = dto.servicesLookingFor;
      if (dto.skillsLookingFor !== undefined) update.connector.skillsLookingFor = dto.skillsLookingFor;
    }

    const updated = await this.profileModel.findOneAndUpdate(
      { userId: id },
      { $set: update },
      { upsert: true, new: true },
    );
    return updated.toObject();
  }

  pickPublic(profile: Profile): any {
    const base = {
      userId: profile.userId,
      role: profile.role,
      fullName: profile.fullName,
      email: profile.email,
      profilePhotoUrl: profile.profilePhotoUrl,
      languages: profile.languages,
    };
    if (profile.role === UserRole.JOB_SEEKER) {
      return {
        ...base,
        workingHours: profile.seeker?.workingHours,
        rate: profile.seeker?.rate,
        jobTitles: profile.seeker?.jobTitles || [],
        bio: profile.seeker?.bio,
        services: profile.seeker?.services || [],
        skills: profile.seeker?.skills || [],
        documents: profile.seeker?.documents || [],
      };
    }
    if (profile.role === UserRole.TALENT_CONNECTOR) {
      return {
        ...base,
        bio: profile.connector?.bio,
        servicesLookingFor: profile.connector?.servicesLookingFor || [],
        skillsLookingFor: profile.connector?.skillsLookingFor || [],
      };
    }
    return base;
  }

  async getPublicByUserId(targetUserId: string) {
    const profile = await this.profileModel.findOne({ userId: new Types.ObjectId(targetUserId) });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.pickPublic(profile.toObject() as any);
  }

  async listPublic(role?: UserRole, q?: string, page = 1, limit = 10) {
    const filter: any = {};
    if (role) filter.role = role;
    if (q) filter.fullName = { $regex: q, $options: 'i' };
    const skip = (Math.max(1, +page) - 1) * Math.max(1, +limit);
    const [items, total] = await Promise.all([
      this.profileModel.find(filter).skip(skip).limit(Math.max(1, +limit)),
      this.profileModel.countDocuments(filter),
    ]);
    return {
      total,
      page: +page,
      limit: +limit,
      items: items.map((p) => this.pickPublic(p.toObject() as any)),
    };
  }

  async uploadDocument(userId: string, file: any, documentType: string) {
    // Convert file to base64 for storage
    const base64Data = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    return {
      url: dataUrl,
      filename: file.originalname,
      type: documentType,
    };
  }

  async saveDocuments(userId: string, documents: any[]) {
    const id = new Types.ObjectId(userId);
    const updated = await this.profileModel.findOneAndUpdate(
      { userId: id },
      { $set: { 'seeker.documents': documents } },
      { new: true }
    );
    return updated?.toObject();
  }

  async deleteDocument(userId: string, documentUrl: string) {
    const id = new Types.ObjectId(userId);
    const profile = await this.profileModel.findOne({ userId: id });
    
    if (profile?.seeker?.documents) {
      profile.seeker.documents = profile.seeker.documents.filter(
        (doc: any) => doc.url !== documentUrl
      );
      await profile.save();
    }
    
    return { success: true };
  }
}

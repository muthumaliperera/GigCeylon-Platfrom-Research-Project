import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async listUsers(params: { role: 'job_seeker' | 'talent_connector'; search: string; page: number; pageSize: number }) {
    const { role, search, page, pageSize } = params;
    const filter: any = { role };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.max(pageSize, 1))
        .select('firstName lastName email role isActive createdAt')
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    // Add static phone and rate on the fly for UI
    const augmented = items.map((u: any) => ({
      ...u,
      phone: '+94 71 234 5678',
      rate: 1000,
    }));

    return { items: augmented, total, page, pageSize };
  }

  async createUser(body: { firstName: string; lastName: string; email: string; password: string; role: 'job_seeker' | 'talent_connector' }) {
    const { firstName, lastName, email, password, role } = body;

    if (![UserRole.JOB_SEEKER, UserRole.TALENT_CONNECTOR].includes(role as any)) {
      throw new ConflictException('Invalid role');
    }

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = new this.userModel({ firstName, lastName, email, password: hashed, role, isActive: true });
    const saved = await user.save();

    return { id: saved._id, email: saved.email, role: saved.role };
  }

  async updateUser(id: string, body: { firstName?: string; lastName?: string; isActive?: boolean }) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (typeof body.firstName === 'string') user.firstName = body.firstName;
    if (typeof body.lastName === 'string') user.lastName = body.lastName;
    if (typeof body.isActive === 'boolean') user.isActive = body.isActive;

    await user.save();
    return { id: user._id, email: user.email, role: user.role, isActive: user.isActive };
  }

  async toggleActive(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    await user.save();
    return { id: user._id, isActive: user.isActive };
  }
}

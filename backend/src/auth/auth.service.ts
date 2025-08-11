import { ConflictException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { CreateAdminDto } from '../dto/create-admin.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = new this.userModel({
      ...userData,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    
    // Generate JWT token
    const token = this.generateToken(savedUser);

    return {
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  // One-time bootstrap to create a super admin. Fails if an admin already exists.
  async bootstrapAdmin(dto: CreateAdminDto) {
    // Check if an admin already exists
    const existingAdmin = await this.userModel.findOne({ role: UserRole.ADMIN });
    if (existingAdmin) {
      throw new ConflictException('Super admin already exists');
    }

    // Ensure email is not taken
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const admin = new this.userModel({
      firstName: 'Super',
      lastName: 'Admin',
      email: dto.email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    const saved = await admin.save();

    return {
      message: 'Super admin created',
      user: {
        id: saved._id,
        email: saved.email,
        role: saved.role,
      },
    };
  }

  async validateUserById(userId: string) {
    this.logger.debug(`Auth Service - Validating user by ID: ${userId} (type: ${typeof userId})`);
    
    try {
      const user = await this.userModel.findById(userId).select('-password');
      this.logger.debug(`Auth Service - User lookup result: ${user ? 'Found' : 'Not found'}`);
      
      if (user) {
        this.logger.debug(`Auth Service - Found user: ${user.email} (${user._id})`);
      } else {
        this.logger.error(`Auth Service - No user found with ID: ${userId}`);
        // Try to find if there are any users in the database
        const userCount = await this.userModel.countDocuments();
        this.logger.error(`Auth Service - Total users in database: ${userCount}`);
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Auth Service - Database error during user lookup: ${error.message}`);
      return null;
    }
  }

  private generateToken(user: UserDocument) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    this.logger.debug(`Auth Service - Generating token for user: ${user.email} (${user._id})`);
    this.logger.debug(`Auth Service - Token payload: ${JSON.stringify(payload)}`);
    this.logger.debug(`Auth Service - JWT Secret available: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
    
    const token = this.jwtService.sign(payload);
    this.logger.debug(`Auth Service - Token generated successfully, length: ${token.length}`);
    return token;
  }
}
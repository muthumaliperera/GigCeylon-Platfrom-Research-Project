import { Body, Controller, Post, ValidationPipe, Get, UseGuards, Request } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Get('debug')
  @UseGuards(JwtAuthGuard)
  async debugAuth(@Request() req) {
    return {
      message: 'Authentication successful',
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      },
      jwtSecretPresent: !!process.env.JWT_SECRET,
      timestamp: new Date().toISOString()
    };
  }
}
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      this.logger.debug(`JWT Strategy - Validating payload: ${JSON.stringify(payload)}`);
      this.logger.debug(`JWT Strategy - Secret being used: ${process.env.JWT_SECRET ? 'Present' : 'Missing'}`);
      
      if (!payload || !payload.sub) {
        this.logger.warn(`JWT Strategy - Invalid payload structure: ${JSON.stringify(payload)}`);
        throw new UnauthorizedException('Invalid token payload');
      }

      // Coerce ObjectId to string if necessary
      const userId = typeof payload.sub === 'object' && payload.sub !== null && 'toString' in payload.sub
        ? (payload.sub as any).toString()
        : String(payload.sub);

      this.logger.debug(`JWT Strategy - Looking up user with ID: ${userId} (orig type: ${typeof payload.sub})`);
      const user = await this.authService.validateUserById(userId);
      
      if (!user) {
        this.logger.error(`JWT Strategy - User not found for sub: ${userId}`);
        this.logger.error(`JWT Strategy - Payload sub type: ${typeof payload.sub}`);
        this.logger.error(`JWT Strategy - Full payload: ${JSON.stringify(payload)}`);
        throw new UnauthorizedException('User associated with token no longer exists');
      }
      
      this.logger.debug(`JWT Strategy - User found: ${user.email} (${user._id})`);
      return user;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        this.logger.warn(`JWT Strategy - Unauthorized: ${err.message}`);
        throw err;
      }
      this.logger.error(`JWT Strategy - Validation error: ${err.message}`, err.stack);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}

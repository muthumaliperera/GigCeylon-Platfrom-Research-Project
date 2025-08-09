import { ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    this.logger.debug(`JWT Guard - Authorization header: ${authHeader ? 'Present' : 'Missing'}`);
    if (authHeader) {
      this.logger.debug(`JWT Guard - Header value: ${authHeader.substring(0, 20)}...`);
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    this.logger.debug(`JWT Guard - handleRequest called`);
    this.logger.debug(`JWT Guard - Error: ${err ? err.message : 'None'}`);
    this.logger.debug(`JWT Guard - User: ${user ? 'Present' : 'Missing'}`);
    this.logger.debug(`JWT Guard - Info: ${info ? JSON.stringify(info) : 'None'}`);
    
    if (err || !user) {
      this.logger.warn(`JWT Guard - Authentication failed: ${err ? err.message : 'No user found'}`);
      throw err || new UnauthorizedException('Authentication failed');
    }
    this.logger.debug(`JWT Guard - Authentication successful for user: ${user._id}`);
    return user;
  }
}
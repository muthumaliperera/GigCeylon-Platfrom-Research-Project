import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Profile, ProfileSchema } from '../schemas/profile.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { ProfilesPublicController } from './profile.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [ProfileController, ProfilesPublicController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}

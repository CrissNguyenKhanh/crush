import { ExtractJwt, Strategy } from 'passport-jwt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UsersService } from 'modules/users/users.service';
import { IUser } from 'common/types/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY')!,
    });
  }

  async validate(payload: IUser) {
    const user = await this.usersService.findOneByEmail(payload.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      role: user.role,
      permissions: user.role?.permissions || [],
      managerId: user.managerId || undefined,
    };
  }
}

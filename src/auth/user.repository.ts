import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;

    const user = new User();
    user.username = username;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (e) {
      if (e.code === '23505') {
        // duplicate value on unique field (username)
        throw new ConflictException('Username already exists.');
      } else {
        throw new InternalServerErrorException(e);
      }
    }
  }
  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<string> {
    const { username, password } = authCredentialsDto;
    const user = await this.findOne({ username });
    if (user && (await user.validatePassword(password))) {
      return user.username;
    } else {
      return null;
    }
  }
  private async hashPassword(password: string, salt: string): Promise<string> {
    // Adding additional layer of salt from bcrypt.genSalt()
    // to the end of the user password separated by #.
    const saltedPassword = password + '#' + salt;
    // Hash the salted password with argon2id
    return await argon2.hash(saltedPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      hashLength: 75,
    });
  }
}

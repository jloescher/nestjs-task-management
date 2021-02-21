import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import * as argon2 from 'argon2';

@Entity()
@Unique(['username'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  async validatePassword(password: string): Promise<boolean> {
    // Do this to match the password input to argon originally.
    // this.salt pulls the salt from the user entity.
    const saltedPassword = password + '#' + this.salt;
    // Check password with # and salt added against the argon2id hash.
    return await argon2.verify(this.password, saltedPassword);
  }
}

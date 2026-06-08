import { UserDAL } from '../dal/UserDAL.js';
import { User as UserType } from '../models/User.js';

export class UserService {
  static async findByGoogleId(googleId: string) {
    return await UserDAL.findOne({ googleId });
  }

  static async findById(id: string) {
    return await UserDAL.findById(id);
  }

  static async create(data: Partial<UserType>) {
    return await UserDAL.create(data);
  }

  static async getCount() {
    return await UserDAL.count();
  }

  static async getApprovedUsers() {
    return await UserDAL.find({ isApproved: true });
  }
}

import User, { User as UserType } from '../models/User.js';

export class UserDAL {
  static async findOne(query: any) {
    return await User.findOne(query);
  }

  static async findById(id: string) {
    return await User.findById(id);
  }

  static async count(query: any = {}) {
    return await User.countDocuments(query);
  }

  static async create(data: Partial<UserType>) {
    const user = new User(data);
    return await user.save();
  }
}

import { Sequelize } from 'sequelize-typescript';
import { VKCommunity } from '../models/vk-community.model';
import { UserGroup } from '../models/userGroup.model';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_URL || './database.sqlite',
  models: [VKCommunity, UserGroup],
});
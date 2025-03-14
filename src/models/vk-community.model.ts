import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class VKCommunity extends Model {
  @Column
  group_id!: number;

  @Column
  access_token!: string;

  @Column
  confirmation_code!: string;
}
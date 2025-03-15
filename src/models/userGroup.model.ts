import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table
export class UserGroup extends Model {
  @Column
  userIdTg!: string;

  @Column
  pubsub_token!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true, 
    defaultValue: []
  })
  conversationList!: Array<{
    groupIdTg: number;
    conversationIdChatwoot: number;
  }>;

}
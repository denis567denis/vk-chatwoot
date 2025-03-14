import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class UserGroup extends Model {
  @Column
  userTgId!: number;

  @Column
  conversationList?: [
    {
        groubIdTg: number,
        conversationIdChatwoot: number
    }
  ];

}
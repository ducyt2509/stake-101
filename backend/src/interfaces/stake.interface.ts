import { ActionType } from '../enums/stake.enum';
import { Document } from 'mongoose';

export interface IStake {
  _id?: string;
  block: number;
  transactionHash: string;
  totalAmount: String;
  action: string;
  userAddress: string;
  timestamp: number;
  attributes: Record<string, any>;
}

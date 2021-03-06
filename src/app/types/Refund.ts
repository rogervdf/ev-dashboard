import { Data } from './Table';
import { User } from './User';

export interface RefundReport extends Data {
  id: string;
  user: User;
}

export enum RefundStatus {
  SUBMITTED = 'submitted',
  NOT_SUBMITTED = 'notSubmitted',
  CANCELLED = 'cancelled',
  APPROVED = 'approved',
}

export enum RefundType {
  REFUNDED = 'refunded',
  NOT_REFUNDED = 'notRefunded',
}

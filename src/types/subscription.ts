export interface SubscriptionFormData {
  name: string;
  icon?: string;
  iconImage?: string;
  icon_image_url?: string;
  price: number;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY';
  renew_date: string;
  start_date?: string;
  payment_date?: number;
  payment_card?: string;
  url?: string;
  color?: string;
  category?: string;
  is_active?: boolean;
}

export interface Subscription {
  id: number;
  databaseId?: string;
  name: string;
  icon: string;
  iconImage?: string;
  price: number;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY' | 'CNY';
  renewDate: string;
  startDate: string;
  paymentDate?: string;
  paymentCard?: string;
  url?: string;
  color?: string;
  category?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriptionOperationState = 'idle' | 'adding' | 'updating' | 'deleting' | 'loading';

export interface SubscriptionOperationStatus {
  state: SubscriptionOperationState;
  progress?: string;
  error?: string;
}
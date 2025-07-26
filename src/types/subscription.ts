export interface Subscription {
  id: number;
  databaseId?: string;
  name: string;
  icon: string;
  iconImage?: string;
  price: number;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
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

export interface AlarmHistory {
  id: string;
  type: 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'renewal_reminder' | 'payment_due';
  content: string;
  target: string;
  date: string;
  datetime: string;
  icon: React.ComponentType<any>;
  iconBackground: string;
  subscriptionId?: string;
  subscriptionImage?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export interface CustomService {
  name: string;
  price: string;
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY';
  renewalDate: string;
  startDate: string;
  paymentDate: string;
  paymentCard: string;
  url: string;
  category: string;
  notifications: boolean;
  iconImage: string;
}

export interface Profile {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  coverPhoto?: string;
}

export interface ExchangeRate {
  date: string;
  rate: number;
  currency: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  subscription: Subscription;
  type: 'renewal' | 'payment';
}

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

export type SubscriptionOperationState = 'idle' | 'adding' | 'updating' | 'deleting' | 'loading';

export interface SubscriptionOperationStatus {
  state: SubscriptionOperationState;
  progress?: string;
  error?: string;
}
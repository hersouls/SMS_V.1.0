import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://hmgxlxnrarciimggycxj.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZ3hseG5yYXJjaWltZ2d5Y3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTEyMTMsImV4cCI6MjA2ODQyNzIxM30.F39Ko64J1tewWuw6OLLPTSLjy4gdE9L9yNgn56wbP7k';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // 추가 설정
    debug: process.env.NODE_ENV === 'development',
  },
  // 전역 오류 처리
  global: {
    headers: {
      'X-Client-Info': 'subscription-manager-web',
    },
  },
});

// Supabase 클라이언트 상태 확인 함수
export const checkSupabaseConnection = async () => {
  try {
    console.log('Checking Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Anon Key length:', supabaseAnonKey?.length || 0);
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { connected: false, error };
    }
    
    console.log('Supabase connection successful');
    return { connected: true, session: data.session };
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return { connected: false, error };
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          photo_url: string | null;
          cover_photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          photo_url?: string | null;
          cover_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          photo_url?: string | null;
          cover_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          icon_image_url: string | null;
          price: number;
          currency: 'USD' | 'KRW' | 'EUR' | 'JPY';
          renew_date: string;
          start_date: string | null;
          payment_date: number | null;
          payment_card: string | null;
          url: string | null;
          color: string;
          category: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          icon_image_url?: string | null;
          price: number;
          currency?: 'USD' | 'KRW' | 'EUR' | 'JPY';
          renew_date: string;
          start_date?: string | null;
          payment_date?: number | null;
          payment_card?: string | null;
          url?: string | null;
          color?: string;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          icon_image_url?: string | null;
          price?: number;
          currency?: 'USD' | 'KRW' | 'EUR' | 'JPY';
          renew_date?: string;
          start_date?: string | null;
          payment_date?: number | null;
          payment_card?: string | null;
          url?: string | null;
          color?: string;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_services: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          price: string;
          currency: 'USD' | 'KRW' | 'EUR' | 'JPY';
          renewal_date: string;
          start_date: string | null;
          payment_date: number | null;
          payment_card: string | null;
          url: string | null;
          category: string | null;
          notifications: boolean;
          icon_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          price: string;
          currency?: 'USD' | 'KRW' | 'EUR' | 'JPY';
          renewal_date: string;
          start_date?: string | null;
          payment_date?: number | null;
          payment_card?: string | null;
          url?: string | null;
          category?: string | null;
          notifications?: boolean;
          icon_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          price?: string;
          currency?: 'USD' | 'KRW' | 'EUR' | 'JPY';
          renewal_date?: string;
          start_date?: string | null;
          payment_date?: number | null;
          payment_card?: string | null;
          url?: string | null;
          category?: string | null;
          notifications?: boolean;
          icon_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'success' | 'warning' | 'error' | 'info';
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'success' | 'warning' | 'error' | 'info';
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'success' | 'warning' | 'error' | 'info';
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      alarm_history: {
        Row: {
          id: string;
          user_id: string;
          type: 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'renewal_reminder' | 'payment_due';
          content: string;
          target: string;
          subscription_id: string | null;
          subscription_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'renewal_reminder' | 'payment_due';
          content: string;
          target: string;
          subscription_id?: string | null;
          subscription_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'renewal_reminder' | 'payment_due';
          content?: string;
          target?: string;
          subscription_id?: string | null;
          subscription_image_url?: string | null;
          created_at?: string;
        };
      };
      exchange_rates: {
        Row: {
          id: string;
          base_currency: string;
          target_currency: string;
          rate: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          base_currency: string;
          target_currency: string;
          rate: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          base_currency?: string;
          target_currency?: string;
          rate?: number;
          date?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_currency: 'USD' | 'KRW' | 'EUR' | 'JPY';
      notification_type: 'success' | 'warning' | 'error' | 'info';
      alarm_type: 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'renewal_reminder' | 'payment_due';
    };
  };
}

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type CustomService = Database['public']['Tables']['custom_services']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type AlarmHistory = Database['public']['Tables']['alarm_history']['Row'];
export type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row']; 
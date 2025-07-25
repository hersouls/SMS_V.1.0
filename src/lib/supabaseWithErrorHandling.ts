import { supabase } from './supabase';
import { NetworkRetryManager } from './networkRecovery';
import { ErrorMessageGenerator, AppError } from './errorHandlingSystem';

/**
 * 에러 처리가 통합된 Supabase 클라이언트 래퍼
 */
export class SupabaseWithErrorHandling {
  /**
   * 데이터 조회 (재시도 로직 포함)
   */
  static async fetchData<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    const result = await NetworkRetryManager.withRetry(
      async () => {
        const { data, error } = await operation();
        if (error) throw error;
        return data;
      },
      {
        maxAttempts: 3,
        baseDelay: 1000,
        retryableErrors: ['network', 'timeout', 'fetch failed', 'connection failed']
      },
      context
    );

    if (result.success) {
      return { data: result.data || null, error: null };
    } else {
      return { data: null, error: result.error || null };
    }
  }

  /**
   * 데이터 생성 (재시도 로직 포함)
   */
  static async insertData<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    const result = await NetworkRetryManager.withRetry(
      async () => {
        const { data, error } = await operation();
        if (error) throw error;
        return data;
      },
      {
        maxAttempts: 2, // 생성 작업은 재시도 횟수를 줄임
        baseDelay: 500,
        retryableErrors: ['network', 'timeout', 'fetch failed']
      },
      context
    );

    if (result.success) {
      return { data: result.data || null, error: null };
    } else {
      return { data: null, error: result.error || null };
    }
  }

  /**
   * 데이터 업데이트 (재시도 로직 포함)
   */
  static async updateData<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    const result = await NetworkRetryManager.withRetry(
      async () => {
        const { data, error } = await operation();
        if (error) throw error;
        return data;
      },
      {
        maxAttempts: 2,
        baseDelay: 500,
        retryableErrors: ['network', 'timeout', 'fetch failed']
      },
      context
    );

    if (result.success) {
      return { data: result.data || null, error: null };
    } else {
      return { data: null, error: result.error || null };
    }
  }

  /**
   * 데이터 삭제 (재시도 로직 포함)
   */
  static async deleteData(
    operation: () => Promise<{ error: any }>,
    context: string
  ): Promise<{ error: AppError | null }> {
    const result = await NetworkRetryManager.withRetry(
      async () => {
        const { error } = await operation();
        if (error) throw error;
        return true;
      },
      {
        maxAttempts: 2,
        baseDelay: 500,
        retryableErrors: ['network', 'timeout', 'fetch failed']
      },
      context
    );

    if (result.success) {
      return { error: null };
    } else {
      return { error: result.error || null };
    }
  }

  /**
   * 인증 관련 작업 (재시도 로직 포함)
   */
  static async authOperation<T>(
    operation: () => Promise<{ data: T | null; error: any } | { data: any; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    const result = await NetworkRetryManager.withRetry(
      async () => {
        const { data, error } = await operation();
        if (error) throw error;
        return data;
      },
      {
        maxAttempts: 3,
        baseDelay: 1000,
        retryableErrors: ['network', 'timeout', 'fetch failed', 'auth']
      },
      context
    );

    if (result.success) {
      return { data: result.data || null, error: null };
    } else {
      return { data: null, error: result.error || null };
    }
  }
}

/**
 * 구독 관련 에러 처리 함수들
 */
export const subscriptionErrorHandlers = {
  /**
   * 구독 목록 조회
   */
  async fetchSubscriptions(userId: string) {
    return SupabaseWithErrorHandling.fetchData(
      async () => {
        const result = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        return result;
      },
      'fetch_subscriptions'
    );
  },

  /**
   * 구독 생성
   */
  async createSubscription(subscriptionData: any) {
    return SupabaseWithErrorHandling.insertData(
      async () => {
        const result = await supabase
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single();
        return result;
      },
      'create_subscription'
    );
  },

  /**
   * 구독 업데이트
   */
  async updateSubscription(id: string, updateData: any) {
    return SupabaseWithErrorHandling.updateData(
      async () => {
        const result = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        return result;
      },
      'update_subscription'
    );
  },

  /**
   * 구독 삭제
   */
  async deleteSubscription(id: string) {
    return SupabaseWithErrorHandling.deleteData(
      async () => {
        const result = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', id);
        return result;
      },
      'delete_subscription'
    );
  },

  /**
   * 사용자 프로필 조회
   */
  async fetchProfile(userId: string) {
    return SupabaseWithErrorHandling.fetchData(
      async () => {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return result;
      },
      'fetch_profile'
    );
  },

  /**
   * 사용자 프로필 업데이트
   */
  async updateProfile(userId: string, updateData: any) {
    return SupabaseWithErrorHandling.updateData(
      async () => {
        const result = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single();
        return result;
      },
      'update_profile'
    );
  },

  /**
   * 알림 조회
   */
  async fetchNotifications(userId: string) {
    return SupabaseWithErrorHandling.fetchData(
      async () => {
        const result = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        return result;
      },
      'fetch_notifications'
    );
  },

  /**
   * 알림 생성
   */
  async createNotification(notificationData: any) {
    return SupabaseWithErrorHandling.insertData(
      async () => {
        const result = await supabase
          .from('notifications')
          .insert(notificationData)
          .select()
          .single();
        return result;
      },
      'create_notification'
    );
  },

  /**
   * 알림 읽음 처리
   */
  async markNotificationAsRead(notificationId: string) {
    return SupabaseWithErrorHandling.updateData(
      async () => {
        const result = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .select()
          .single();
        return result;
      },
      'mark_notification_read'
    );
  }
};

/**
 * 인증 관련 에러 처리 함수들
 */
export const authErrorHandlers = {
  /**
   * 로그인
   */
  async signIn(credentials: { email: string; password: string }) {
    return SupabaseWithErrorHandling.authOperation(
      async () => {
        const result = await supabase.auth.signInWithPassword(credentials);
        return result;
      },
      'sign_in'
    );
  },

  /**
   * 회원가입
   */
  async signUp(userData: { email: string; password: string; user_metadata?: any }) {
    return SupabaseWithErrorHandling.authOperation(
      async () => {
        const result = await supabase.auth.signUp(userData);
        return result;
      },
      'sign_up'
    );
  },

  /**
   * 로그아웃
   */
  async signOut() {
    return SupabaseWithErrorHandling.authOperation(
      async () => {
        const result = await supabase.auth.signOut();
        return { data: result, error: null };
      },
      'sign_out'
    );
  },

  /**
   * 현재 세션 조회
   */
  async getSession() {
    return SupabaseWithErrorHandling.authOperation(
      async () => {
        const result = await supabase.auth.getSession();
        return result;
      },
      'get_session'
    );
  },

  /**
   * 비밀번호 재설정
   */
  async resetPassword(email: string) {
    return SupabaseWithErrorHandling.authOperation(
      async () => {
        const result = await supabase.auth.resetPasswordForEmail(email);
        return result;
      },
      'reset_password'
    );
  }
};

/**
 * 네트워크 상태 확인
 */
export const checkNetworkStatus = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error('네트워크 연결을 확인할 수 없습니다.');
    }
    return true;
  } catch (error) {
    const appError = ErrorMessageGenerator.generate(error, 'network_check');
    throw appError;
  }
};
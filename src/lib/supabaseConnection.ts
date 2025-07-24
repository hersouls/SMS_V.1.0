import { SupabaseClient } from '@supabase/supabase-js';
import { handleError, isRetryableError, getRetryDelay } from './errorHandler';

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  latency?: number;
}

export const testSupabaseConnection = async (
  supabase: SupabaseClient, 
  retryCount = 0
): Promise<ConnectionTestResult> => {
  const maxRetries = 3;
  const startTime = Date.now();
  
  try {
    // Simple query to test connection
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      if (retryCount < maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return testSupabaseConnection(supabase, retryCount + 1);
      }
      
      const { userMessage } = handleError(error, 'testSupabaseConnection');
      return {
        success: false,
        error: userMessage,
        latency
      };
    }
    
    return {
      success: true,
      latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const { userMessage } = handleError(error, 'testSupabaseConnection');
    
    if (retryCount < maxRetries && isRetryableError(error)) {
      const delay = getRetryDelay(retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return testSupabaseConnection(supabase, retryCount + 1);
    }
    
    return {
      success: false,
      error: userMessage,
      latency
    };
  }
};

export const waitForConnection = async (
  supabase: SupabaseClient,
  maxAttempts = 5,
  baseDelay = 1000
): Promise<boolean> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await testSupabaseConnection(supabase);
    
    if (result.success) {
      console.log(`Connection established on attempt ${attempt + 1}`);
      return true;
    }
    
    if (attempt < maxAttempts - 1) {
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Connection attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('Failed to establish connection after all attempts');
  return false;
};

export const withConnectionRetry = async <T>(
  supabase: SupabaseClient,
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = getRetryDelay(attempt);
        console.log(`Operation failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  throw lastError;
};
import { renderHook, act } from '@testing-library/react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { useSupabase } from '../../contexts/SupabaseContext';
import { ERROR_MESSAGES } from '../../lib/utils';

// Mock the Supabase context
jest.mock('../../contexts/SupabaseContext');

const mockUseSupabase = useSupabase as jest.MockedFunction<typeof useSupabase>;

describe('useSupabaseData Hook', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSupabase.mockReturnValue({
      user: mockUser,
      supabase: mockSupabase,
      loading: false,
    });
  });

  describe('loadSubscriptions', () => {
    it('should load subscriptions successfully', async () => {
      const mockData = [
        { id: 1, name: 'Netflix', price: 15.99 },
        { id: 2, name: 'Spotify', price: 9.99 },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useSupabaseData());

      let subscriptions;
      await act(async () => {
        subscriptions = await result.current.loadSubscriptions();
      });

      expect(subscriptions).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should return empty array when user is not authenticated', async () => {
      mockUseSupabase.mockReturnValue({
        user: null,
        supabase: mockSupabase,
        loading: false,
      });

      const { result } = renderHook(() => useSupabaseData());

      let subscriptions;
      await act(async () => {
        subscriptions = await result.current.loadSubscriptions();
      });

      expect(subscriptions).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSupabaseData());

      let subscriptions;
      await act(async () => {
        subscriptions = await result.current.loadSubscriptions();
      });

      expect(subscriptions).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        mockError.message,
        mockError
      );
      consoleSpy.mockRestore();
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSupabaseData());

      let subscriptions;
      await act(async () => {
        subscriptions = await result.current.loadSubscriptions();
      });

      expect(subscriptions).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unexpected error',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('loadNotifications', () => {
    it('should load notifications successfully', async () => {
      const mockData = [
        { id: 1, type: 'success', title: 'Success', message: 'Operation completed' },
        { id: 2, type: 'warning', title: 'Warning', message: 'Please check your data' },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useSupabaseData());

      let notifications;
      await act(async () => {
        notifications = await result.current.loadNotifications();
      });

      expect(notifications).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should return empty array when user is not authenticated', async () => {
      mockUseSupabase.mockReturnValue({
        user: null,
        supabase: mockSupabase,
        loading: false,
      });

      const { result } = renderHook(() => useSupabaseData());

      let notifications;
      await act(async () => {
        notifications = await result.current.loadNotifications();
      });

      expect(notifications).toEqual([]);
    });
  });

  describe('loadAlarmHistory', () => {
    it('should load alarm history successfully', async () => {
      const mockData = [
        { id: 1, alarm_time: '2024-01-15T10:00:00Z', status: 'sent' },
        { id: 2, alarm_time: '2024-01-14T09:00:00Z', status: 'pending' },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useSupabaseData());

      let alarmHistory;
      await act(async () => {
        alarmHistory = await result.current.loadAlarmHistory();
      });

      expect(alarmHistory).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('alarm_history');
    });
  });

  describe('saveNotification', () => {
    it('should save notification successfully', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useSupabaseData());

      await act(async () => {
        await result.current.saveNotification('success', 'Test Title', 'Test Message');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        type: 'success',
        title: 'Test Title',
        message: 'Test Message',
      });
    });

    it('should handle save notification errors', async () => {
      const mockError = { message: 'Save failed' };
      const mockInsert = jest.fn().mockResolvedValue({
        error: mockError,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSupabaseData());

      await act(async () => {
        await result.current.saveNotification('error', 'Error Title', 'Error Message');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        mockError.message,
        mockError
      );
      consoleSpy.mockRestore();
    });

    it('should not save notification when user is not authenticated', async () => {
      mockUseSupabase.mockReturnValue({
        user: null,
        supabase: mockSupabase,
        loading: false,
      });

      const { result } = renderHook(() => useSupabaseData());

      await act(async () => {
        await result.current.saveNotification('info', 'Info Title', 'Info Message');
      });

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should set loading to true during operations', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(mockPromise),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useSupabaseData());

      expect(result.current.loading).toBe(false);

      // Start the operation and wait for state update
      await act(async () => {
        result.current.loadSubscriptions();
        // Wait for the next tick to allow state update
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Loading should be true during the operation
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      resolvePromise!({ data: [], error: null });

      // Wait for the operation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Loading should be false after the operation
      expect(result.current.loading).toBe(false);
    });
  });

  describe('error handling with onError callback', () => {
    it('should call onError callback when provided', async () => {
      const mockError = { message: 'Database error' };
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const onErrorMock = jest.fn();
      const { result } = renderHook(() => useSupabaseData({ onError: onErrorMock }));

      await act(async () => {
        if (result.current) {
          await result.current.loadSubscriptions();
        }
      });

      expect(onErrorMock).toHaveBeenCalledWith(mockError.message);
    });
  });
});
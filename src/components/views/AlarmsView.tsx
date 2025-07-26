import React from 'react';
import { Trash2, Bell } from 'lucide-react';
import { AlarmHistory, Notification } from '../../types/subscription';
import { Button } from '../ui/button';

interface AlarmsViewProps {
  alarmHistory: AlarmHistory[];
  notifications: Notification[];
  onClearAll: () => void;
  onRemoveNotification: (id: string) => void;
}

const AlarmsView: React.FC<AlarmsViewProps> = ({
  alarmHistory,
  notifications,
  onClearAll,
  onRemoveNotification
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">알림</h2>
        {notifications.length > 0 && (
          <Button
            onClick={onClearAll}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            모두 지우기
          </Button>
        )}
      </div>

      {/* Current Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">현재 알림</h3>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 ${
                  notification.type === 'success'
                    ? 'bg-green-50 border-green-400'
                    : notification.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : notification.type === 'error'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {notification.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {notification.timestamp.toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveNotification(notification.id)}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alarm History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">알람 히스토리</h3>
        {alarmHistory.length > 0 ? (
          <div className="space-y-3">
            {alarmHistory.map((alarm) => (
              <div
                key={alarm.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${alarm.iconBackground}`}
                  >
                    {React.createElement(alarm.icon, {
                      className: 'w-4 h-4 text-white'
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {alarm.content}
                    </p>
                    <p className="text-sm text-gray-500">
                      {alarm.target}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(alarm.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Bell className="w-12 h-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              알람 히스토리가 없습니다
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              구독 활동이 여기에 표시됩니다.
            </p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && alarmHistory.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Bell className="w-12 h-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            알림이 없습니다
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            새로운 알림이 여기에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default AlarmsView;
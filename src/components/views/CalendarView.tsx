import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { useCalendarManager } from '../../hooks/useCalendarManager';
import { Button } from '../ui/button';

interface CalendarViewProps {
  calendarManager: ReturnType<typeof useCalendarManager>;
  subscriptions: Subscription[];
  onEditSubscription: (subscription: Subscription) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  calendarManager,
  subscriptions,
  onEditSubscription
}) => {
  const {
    currentDate,
    getDaysInMonth,
    formatDateForCalendar,
    getEventsForDate,
    isToday,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday
  } = calendarManager;

  const days = getDaysInMonth(currentDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">달력</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={goToPreviousMonth}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={goToToday}
            variant="outline"
            size="sm"
          >
            오늘
          </Button>
          <Button
            onClick={goToNextMonth}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-700">
          {formatDateForCalendar(currentDate)}
        </h3>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[120px] border-r border-b border-gray-200 bg-gray-50"
                />
              );
            }

            const events = getEventsForDate(day, subscriptions);
            const isTodayDate = isToday(day);
            const isCurrentMonthDate = isCurrentMonth(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  isTodayDate ? 'bg-blue-50' : ''
                }`}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isTodayDate
                        ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                        : isCurrentMonthDate
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {events.length > 0 && (
                    <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                      {events.length}
                    </span>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded cursor-pointer ${
                        event.type === 'renewal'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                      onClick={() => onEditSubscription(event.subscription)}
                      title={event.title}
                    >
                      <div className="truncate">{event.subscription.name}</div>
                      <div className="text-xs opacity-75">
                        {event.type === 'renewal' ? '갱신' : '결제'}
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{events.length - 3} 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>갱신일</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-100 rounded"></div>
          <span>결제일</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
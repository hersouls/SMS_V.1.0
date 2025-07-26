import { useState, useCallback } from 'react';
import { Subscription, CalendarEvent } from '../types/subscription';

export const useCalendarManager = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get days in month
  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, []);

  // Format date for calendar display
  const formatDateForCalendar = useCallback((date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, []);

  // Get subscription events for calendar
  const getSubscriptionEvents = useCallback((subscriptions: Subscription[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    
    subscriptions.forEach(subscription => {
      if (!subscription.isActive) return;
      
      // Add renewal event
      if (subscription.renewDate) {
        const renewDate = new Date(subscription.renewDate);
        events.push({
          id: `renewal-${subscription.id}`,
          title: `${subscription.name} 갱신`,
          date: renewDate,
          subscription,
          type: 'renewal'
        });
      }
      
      // Add payment event if different from renewal
      if (subscription.paymentDate && subscription.paymentDate !== subscription.renewDate) {
        const paymentDate = new Date(subscription.paymentDate);
        events.push({
          id: `payment-${subscription.id}`,
          title: `${subscription.name} 결제`,
          date: paymentDate,
          subscription,
          type: 'payment'
        });
      }
    });
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, []);

  // Check if date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  // Check if date is in current month
  const isCurrentMonth = useCallback((date: Date) => {
    const current = currentDate;
    return date.getMonth() === current.getMonth() && 
           date.getFullYear() === current.getFullYear();
  }, [currentDate]);

  // Navigate to previous month
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  // Go to today
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date, subscriptions: Subscription[]) => {
    const events = getSubscriptionEvents(subscriptions);
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  }, [getSubscriptionEvents]);

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = useCallback((subscriptions: Subscription[]) => {
    const events = getSubscriptionEvents(subscriptions);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return events.filter(event => 
      event.date >= today && event.date <= nextWeek
    );
  }, [getSubscriptionEvents]);

  // Get overdue events
  const getOverdueEvents = useCallback((subscriptions: Subscription[]) => {
    const events = getSubscriptionEvents(subscriptions);
    const today = new Date();
    
    return events.filter(event => 
      event.date < today
    );
  }, [getSubscriptionEvents]);

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    getDaysInMonth,
    formatDateForCalendar,
    getSubscriptionEvents,
    getEventsForDate,
    getUpcomingEvents,
    getOverdueEvents,
    isToday,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday
  };
};
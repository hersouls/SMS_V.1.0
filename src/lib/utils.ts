import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const ERROR_MESSAGES = {
  SUBSCRIPTION_LOAD_FAILED: '구독 정보를 불러오지 못했습니다.',
  NOTIFICATION_SAVE_FAILED: '알림 저장에 실패했습니다.',
  PROFILE_CREATION_FAILED: '프로필 생성에 실패했습니다.',
  EXCHANGE_RATE_FAILED: '환율 정보를 가져오는데 실패했습니다.',
  GENERIC_ERROR: '예상치 못한 오류가 발생했습니다.'
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}
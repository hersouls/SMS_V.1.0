import React from 'react';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { cn, getInitials } from '../../lib/utils';
import { Home, Bell, User } from 'lucide-react';

interface HeaderProps {
  onHomeClick: () => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  notificationCount?: number;
  profile?: {
    username: string;
    firstName: string;
    lastName: string;
    photo?: string;
  };
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  onNotificationClick,
  onProfileClick,
  notificationCount = 0,
  profile,
  className
}) => {
  return (
    <div className={cn("relative px-4 md:px-8 lg:px-12 pt-8 pb-8", className)}>
      <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto relative z-10">
        {/* 왼쪽: 홈 버튼 */}
        <div className="flex items-center">
          <Button
            onClick={(e) => {
              console.log('홈 버튼 클릭됨 - Header 컴포넌트');
              e.preventDefault();
              e.stopPropagation();
              onHomeClick();
            }}
            variant="ghost"
            className="flex items-center gap-2 lg:gap-3 w-12 h-12 md:w-14 md:h-14 lg:w-auto lg:h-16 lg:px-6 bg-white/20 rounded-full hover:bg-white/40 focus:bg-white/40 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/40 active:scale-95 hover:scale-105 focus:scale-105 pointer-events-auto cursor-pointer shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <Home className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
            <span className="hidden lg:inline text-white font-medium text-lg">홈</span>
          </Button>
        </div>
        
        {/* 오른쪽: 알림 + 아바타 */}
        <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
          <div className="relative">
            <Button
              onClick={(e) => {
                console.log('알람 버튼 클릭됨 - Header 컴포넌트');
                e.preventDefault();
                e.stopPropagation();
                onNotificationClick();
              }}
              variant="ghost"
              className="flex items-center gap-2 lg:gap-3 w-12 h-12 md:w-14 md:h-14 lg:w-auto lg:h-16 lg:px-6 bg-white/20 rounded-full hover:bg-white/40 focus:bg-white/40 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/40 active:scale-95 hover:scale-105 focus:scale-105 pointer-events-auto cursor-pointer shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <Bell className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
              <span className="hidden lg:inline text-white font-medium text-lg">알림</span>
            </Button>
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 md:-top-3 md:-right-3 lg:-top-2 lg:-right-2 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center p-0 text-xs md:text-sm font-bold border-2 border-white z-10"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </div>
          
          <Button
            onClick={(e) => {
              console.log('아바타 버튼 클릭됨 - Header 컴포넌트');
              e.preventDefault();
              e.stopPropagation();
              onProfileClick();
            }}
            variant="ghost"
            className="flex items-center gap-2 lg:gap-3 w-12 h-12 md:w-14 md:h-14 lg:w-auto lg:h-16 lg:px-6 bg-white/20 rounded-full hover:bg-white/40 focus:bg-white/40 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/40 overflow-hidden active:scale-95 hover:scale-105 focus:scale-105 pointer-events-auto cursor-pointer shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {profile?.photo ? (
              <Avatar className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16">
                <AvatarImage src={profile.photo} alt="프로필 사진" />
                <AvatarFallback className="bg-white/20 text-white text-sm md:text-base lg:text-lg">
                  {getInitials(`${profile.firstName} ${profile.lastName}`)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
            )}
            <span className="hidden lg:inline text-white font-medium text-lg">프로필</span>
          </Button>
        </div>
      </div>

      {/* 웨이브 효과 */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 375 60" className="w-full h-15">
          <path
            d="M0,20 C100,0 200,40 375,25 L375,60 L0,60 Z"
            fill="white"
            fillOpacity="0.1"
          />
          <path
            d="M0,35 C150,15 250,50 375,30 L375,60 L0,60 Z"
            fill="white"
            fillOpacity="0.15"
          />
        </svg>
      </div>
    </div>
  );
};

export default Header;
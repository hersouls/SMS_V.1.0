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
    <div className={cn("relative px-4 pt-8 pb-8", className)}>
      <div className="flex justify-between items-center mb-6">
        {/* 왼쪽: 홈 버튼 */}
        <div className="flex items-center">
          <Button
            onClick={onHomeClick}
            variant="ghost"
            size="icon"
            className="w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
          >
            <Home className="w-5 h-5 text-white" />
          </Button>
        </div>
        
        {/* 오른쪽: 알림 + 아바타 */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button
              onClick={onNotificationClick}
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
            >
              <Bell className="w-5 h-5 text-white" />
            </Button>
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs font-bold border-2 border-white"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </div>
          
          <Button
            onClick={onProfileClick}
            variant="ghost"
            size="icon"
            className="w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30 overflow-hidden"
          >
            {profile?.photo ? (
              <Avatar className="w-full h-full">
                <AvatarImage src={profile.photo} alt="프로필 사진" />
                <AvatarFallback className="bg-white/20 text-white">
                  {getInitials(`${profile.firstName} ${profile.lastName}`)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
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
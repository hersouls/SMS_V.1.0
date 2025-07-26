import React from 'react';
import { Plus } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import StatsCard from '../ui/stats-card';
import SubscriptionCard from '../ui/subscription-card';
import { Button } from '../ui/button';

interface SubscriptionViewProps {
  subscriptions: Subscription[];
  onAddSubscription: () => void;
  onEditSubscription: (subscription: Subscription) => void;
  onDeleteSubscription: (id: number) => void;
  totalAmount: number;
  totalCount: number;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  subscriptions,
  onAddSubscription,
  onEditSubscription,
  onDeleteSubscription,
  totalAmount,
  totalCount
}) => {
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive !== false);
  const inactiveSubscriptions = subscriptions.filter(sub => sub.isActive === false);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="총 구독 수"
          value={totalCount.toString()}
          icon="subscriptions"
          trend="up"
          trendValue="+2"
          description="이번 달"
        />
        <StatsCard
          title="월 구독료"
          value={`₩${totalAmount.toLocaleString()}`}
          icon="money"
          trend="up"
          trendValue="+5%"
          description="지난 달 대비"
        />
        <StatsCard
          title="활성 구독"
          value={activeSubscriptions.length.toString()}
          icon="active"
          trend="stable"
          trendValue="0"
          description="현재 상태"
        />
      </div>

      {/* Add Subscription Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">구독 서비스</h2>
        <Button
          onClick={onAddSubscription}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>구독 추가</span>
        </Button>
      </div>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">활성 구독</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onEdit={() => onEditSubscription(subscription)}
                onDelete={() => onDeleteSubscription(subscription.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Subscriptions */}
      {inactiveSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">비활성 구독</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onEdit={() => onEditSubscription(subscription)}
                onDelete={() => onDeleteSubscription(subscription.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">구독이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">첫 번째 구독을 추가해보세요.</p>
          <div className="mt-6">
            <Button
              onClick={onAddSubscription}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>구독 추가</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionView;
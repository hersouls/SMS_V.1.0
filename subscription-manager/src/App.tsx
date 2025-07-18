import React, { useState } from 'react';
import { ArrowLeft, Search, Check, Calendar, DollarSign, Tag, Bell, User, Home, Menu, Plus, Edit2, Trash2 } from 'lucide-react';

interface Subscription {
  id: number;
  name: string;
  icon: string;
  price: number;
  renewDate: string;
  color: string;
  category: string;
}

interface PopularService {
  id: number;
  name: string;
  icon: string;
  price: number;
  color: string;
  category: string;
}

interface CustomService {
  name: string;
  price: string;
  renewalDate: string;
  category: string;
  notifications: boolean;
}

const SubscriptionApp = () => {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'add' | 'manage'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<PopularService | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [customService, setCustomService] = useState<CustomService>({
    name: '',
    price: '',
    renewalDate: '',
    category: '',
    notifications: true
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: 1,
      name: '넷플릭스',
      icon: '🎬',
      price: 19.99,
      renewDate: '2024-06-15',
      color: '#E50914',
      category: '엔터테인먼트'
    },
    {
      id: 2,
      name: 'GPT',
      icon: '🤖',
      price: 20.00,
      renewDate: '2024-06-10',
      color: '#10A37F',
      category: '생산성'
    },
    {
      id: 3,
      name: '디즈니+',
      icon: '✨',
      price: 10.99,
      renewDate: '2024-06-10',
      color: '#113CCF',
      category: '엔터테인먼트'
    },
    {
      id: 4,
      name: '스포티파이',
      icon: '🎵',
      price: 9.99,
      renewDate: '2024-06-01',
      color: '#1DB954',
      category: '음악'
    }
  ]);

  const [popularServices] = useState<PopularService[]>([
    { id: 1, name: '넷플릭스', icon: '🎬', price: 19.99, color: '#E50914', category: '엔터테인먼트' },
    { id: 2, name: '유튜브 프리미엄', icon: '📺', price: 13.99, color: '#FF0000', category: '엔터테인먼트' },
    { id: 3, name: '스포티파이', icon: '🎵', price: 9.99, color: '#1DB954', category: '음악' },
    { id: 4, name: '애플 뮤직', icon: '🍎', price: 10.99, color: '#FA2D48', category: '음악' },
    { id: 5, name: '디즈니+', icon: '✨', price: 10.99, color: '#113CCF', category: '엔터테인먼트' },
    { id: 6, name: '아마존 프라임', icon: '📦', price: 14.99, color: '#FF9900', category: '쇼핑' },
    { id: 7, name: 'ChatGPT Plus', icon: '🤖', price: 20.00, color: '#10A37F', category: '생산성' },
    { id: 8, name: '어도비 크리에이티브', icon: '🎨', price: 52.99, color: '#FF0050', category: '생산성' },
    { id: 9, name: '노션', icon: '📝', price: 8.00, color: '#000000', category: '생산성' },
    { id: 10, name: '깃허브 프로', icon: '💻', price: 4.00, color: '#24292E', category: '개발' }
  ]);

  const categories = ['전체', '엔터테인먼트', '음악', '생산성', '쇼핑', '개발'];
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const totalAmount = subscriptions.reduce((sum, sub) => sum + sub.price, 0);

  const filteredServices = popularServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleServiceSelect = (service: PopularService) => {
    setSelectedService(service);
    setCustomService({
      name: service.name,
      price: service.price.toString(),
      renewalDate: '',
      category: service.category,
      notifications: true
    });
  };

  const handleCustomInput = (field: keyof CustomService, value: string | boolean) => {
    setCustomService(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSubscription = () => {
    if (!customService.name || !customService.price) return;
    
    const newSubscription: Subscription = {
      id: Date.now(),
      name: customService.name,
      icon: selectedService?.icon || '📱',
      price: parseFloat(customService.price),
      renewDate: customService.renewalDate,
      color: selectedService?.color || '#6C63FF',
      category: customService.category
    };

    setSubscriptions(prev => [...prev, newSubscription]);
    setCurrentScreen('main');
    resetForm();
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setCustomService({
      name: subscription.name,
      price: subscription.price.toString(),
      renewalDate: subscription.renewDate,
      category: subscription.category,
      notifications: true
    });
    setCurrentScreen('add');
  };

  const handleUpdateSubscription = () => {
    if (!customService.name || !customService.price || !editingSubscription) return;

    setSubscriptions(prev => prev.map(sub => 
      sub.id === editingSubscription.id 
        ? {
            ...sub,
            name: customService.name,
            price: parseFloat(customService.price),
            renewDate: customService.renewalDate,
            category: customService.category
          }
        : sub
    ));
    
    setCurrentScreen('main');
    setEditingSubscription(null);
    resetForm();
  };

  const handleDeleteSubscription = (id: number) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  const resetForm = () => {
    setSelectedService(null);
    setCustomService({
      name: '',
      price: '',
      renewalDate: '',
      category: '',
      notifications: true
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // 메인 구독 관리 화면
  if (currentScreen === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <div className="relative px-4 pt-8 pb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-white text-3xl font-bold tracking-tight">구독 관리</h1>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-6 h-6 text-white" />
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

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-8 pb-24 min-h-[70vh] -mt-4 relative z-10">
          <p className="text-gray-600 text-lg font-medium mb-8 text-center">
            구독 서비스를 관리하세요
          </p>

          {/* 총액 카드 */}
          <div className="bg-white rounded-2xl p-6 shadow-md mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 text-lg font-medium mb-1">총액:</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${totalAmount.toFixed(2)} <span className="text-lg font-normal text-gray-500">/ 월</span>
                </p>
              </div>
              <button 
                onClick={() => setCurrentScreen('manage')}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                관리하기
              </button>
            </div>
          </div>

          {/* 구독 서비스 리스트 */}
          <div className="space-y-4 mb-8">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
                      style={{ backgroundColor: subscription.color }}
                    >
                      {subscription.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {subscription.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        갱신일: {formatDate(subscription.renewDate)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    ${subscription.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 구독 추가 버튼 */}
          <button 
            onClick={() => {
              setCurrentScreen('add');
              resetForm();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="w-5 h-5" />
            구독 추가하기
          </button>
        </div>

        {/* 하단 네비게이션 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex justify-around items-center">
            <button className="flex flex-col items-center gap-1 py-2 px-4 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg">
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">홈</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 px-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg transition-colors duration-200">
              <Menu className="w-6 h-6" />
              <span className="text-xs font-medium">메뉴</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-2 px-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg transition-colors duration-200">
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">프로필</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 구독 관리 화면
  if (currentScreen === 'manage') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* 헤더 영역 */}
        <div className="relative px-4 pt-8 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setCurrentScreen('main')}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-2xl font-bold tracking-tight">구독 관리</h1>
          </div>

          {/* 웨이브 효과 */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 375 60" className="w-full h-15">
              <path
                d="M0,20 C100,0 200,40 375,25 L375,60 L0,60 Z"
                fill="white"
                fillOpacity="0.1"
              />
            </svg>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">내 구독 서비스</h2>
            <p className="text-gray-600">총 {subscriptions.length}개의 구독 서비스</p>
          </div>

          {/* 구독 서비스 관리 리스트 */}
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
                      style={{ backgroundColor: subscription.color }}
                    >
                      {subscription.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {subscription.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">{subscription.category}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        갱신일: {formatDate(subscription.renewDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">
                      ${subscription.price}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubscription(subscription)}
                        className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 새 구독 추가 버튼 */}
          <button 
            onClick={() => {
              setCurrentScreen('add');
              resetForm();
            }}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="w-5 h-5" />
            새 구독 추가
          </button>
        </div>
      </div>
    );
  }

  // 구독 추가/수정 화면
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700" style={{ fontFamily: "'Nanum Gothic', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"
        rel="stylesheet"
      />
      
      {/* 헤더 영역 */}
      <div className="relative px-4 pt-8 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => {
              setCurrentScreen('main');
              setEditingSubscription(null);
              resetForm();
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            {editingSubscription ? '구독 수정' : '구독 추가'}
          </h1>
        </div>

        {!editingSubscription && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
            <div className="text-white/80 text-sm font-medium mb-1">현재 총 구독료</div>
            <div className="text-white text-2xl font-bold">
              ${totalAmount.toFixed(2)} <span className="text-lg font-normal text-white/80">/ 월</span>
            </div>
            <div className="text-white/70 text-sm mt-1">{subscriptions.length}개 서비스 구독 중</div>
          </div>
        )}

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

      {/* 메인 콘텐츠 */}
      <div className="bg-gray-50 rounded-t-3xl px-4 pt-6 pb-24 min-h-[75vh] -mt-4 relative z-10">
        
        {!editingSubscription && (
          <>
            {/* 검색 바 */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="서비스 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 인기 서비스 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">인기 서비스</h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      selectedService?.id === service.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
                        style={{ backgroundColor: service.color }}
                      >
                        {service.icon}
                      </div>
                      {selectedService?.id === service.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{service.category}</p>
                    <p className="text-lg font-bold text-gray-900">${service.price}/월</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 구독 정보 입력 폼 */}
        {(selectedService || editingSubscription) && (
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">구독 정보</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  서비스 이름
                </label>
                <input
                  type="text"
                  value={customService.name}
                  onChange={(e) => handleCustomInput('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  월 구독료
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customService.price}
                  onChange={(e) => handleCustomInput('price', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  다음 갱신 날짜
                </label>
                <input
                  type="date"
                  value={customService.renewalDate}
                  onChange={(e) => handleCustomInput('renewalDate', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">갱신 알림</span>
                </div>
                <button
                  onClick={() => handleCustomInput('notifications', !customService.notifications)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    customService.notifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      customService.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <button
          onClick={editingSubscription ? handleUpdateSubscription : handleAddSubscription}
          disabled={!customService.name || !customService.price}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {editingSubscription ? '구독 수정하기' : '구독 추가하기'}
        </button>

        {!editingSubscription && (
          <button className="w-full mt-4 text-blue-600 hover:text-blue-700 py-3 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl">
            원하는 서비스가 없나요? 직접 구독 추가하기
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionApp;
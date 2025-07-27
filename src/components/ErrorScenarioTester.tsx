import React, { useState } from 'react';
import { EnhancedSubscriptionApp } from './EnhancedSubscriptionApp';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const ErrorScenarioTester: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<string>('normal');

  const scenarios = {
    normal: {
      name: '정상 상태',
      description: '모든 데이터가 정상적으로 작동하는 상태'
    },
    invalidPrices: {
      name: '잘못된 가격 데이터',
      description: 'NaN, undefined, 음수 등의 잘못된 가격 정보'
    },
    invalidExchangeRate: {
      name: '잘못된 환율',
      description: 'NaN, 0, 무한대 등의 잘못된 환율 정보'
    },
    apiFailure: {
      name: 'API 실패',
      description: '환율 API 연결 실패 시나리오'
    },
    mixedErrors: {
      name: '복합 오류',
      description: '여러 오류가 동시에 발생하는 상황'
    }
  };

  const injectErrors = (scenario: string) => {
    // 실제로는 전역 상태나 컨텍스트를 통해 오류를 주입
    console.log(`Injecting ${scenario} scenario`);
    
    switch (scenario) {
      case 'invalidPrices':
        // 잘못된 가격 데이터 시뮬레이션
        window.localStorage.setItem('testScenario', 'invalidPrices');
        break;
      case 'invalidExchangeRate':
        // 잘못된 환율 시뮬레이션
        window.localStorage.setItem('testScenario', 'invalidExchangeRate');
        break;
      case 'apiFailure':
        // API 실패 시뮬레이션
        window.localStorage.setItem('testScenario', 'apiFailure');
        break;
      case 'mixedErrors':
        // 복합 오류 시뮬레이션
        window.localStorage.setItem('testScenario', 'mixedErrors');
        break;
      default:
        window.localStorage.removeItem('testScenario');
    }
    
    setCurrentScenario(scenario);
    window.location.reload(); // 시나리오 적용을 위해 새로고침
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 시나리오 선택 패널 */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4">오류 시나리오 테스터</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{scenario.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  <Button
                    variant={currentScenario === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => injectErrors(key)}
                    className="w-full"
                  >
                    {currentScenario === key ? '현재 활성' : '시나리오 적용'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 실제 앱 */}
      <EnhancedSubscriptionApp />
    </div>
  );
};

export default ErrorScenarioTester;
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  healthCheck, 
  findOverflowElements, 
  checkTouchTargets, 
  checkImageLoading,
  runResponsiveTests,
  getScreenInfo
} from '../utils/responsive-debug';

interface TestResult {
  screen: string;
  overflows: string;
  touchTargets: string;
  images: string;
}

const ResponsiveTestPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthCheck = async () => {
    setIsRunning(true);
    try {
      const results = healthCheck();
      setTestResults(results);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runFullTests = async () => {
    setIsRunning(true);
    try {
      runResponsiveTests();
      const results = healthCheck();
      setTestResults(results);
    } catch (error) {
      console.error('Full tests failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('✅')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status.includes('❌')) return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status.includes('✅')) return 'text-green-600';
    if (status.includes('❌')) return 'text-red-600';
    return 'text-yellow-600';
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 shadow-lg"
          title="반응형 테스트 패널 열기"
        >
          <Eye className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              반응형 테스트
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 현재 화면 정보 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">현재 화면</span>
            </div>
            <div className="text-xs text-gray-600">
              {getScreenInfo().viewport.width} × {getScreenInfo().viewport.height}px
              <br />
              브레이크포인트: {getScreenInfo().breakpoint}
            </div>
          </div>

          {/* 테스트 결과 */}
          {testResults && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">테스트 결과:</span>
                {getStatusIcon(testResults.overflows)}
              </div>
              
              <div className="space-y-1 text-xs">
                <div className={`flex items-center gap-2 ${getStatusColor(testResults.overflows)}`}>
                  {getStatusIcon(testResults.overflows)}
                  <span>오버플로우: {testResults.overflows}</span>
                </div>
                <div className={`flex items-center gap-2 ${getStatusColor(testResults.touchTargets)}`}>
                  {getStatusIcon(testResults.touchTargets)}
                  <span>터치 영역: {testResults.touchTargets}</span>
                </div>
                <div className={`flex items-center gap-2 ${getStatusColor(testResults.images)}`}>
                  {getStatusIcon(testResults.images)}
                  <span>이미지 로딩: {testResults.images}</span>
                </div>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-2">
            <Button
              onClick={runHealthCheck}
              disabled={isRunning}
              className="w-full h-8 text-xs"
              variant="outline"
            >
              {isRunning ? (
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-2" />
              )}
              건강도 체크
            </Button>
            
            <Button
              onClick={runFullTests}
              disabled={isRunning}
              className="w-full h-8 text-xs"
              variant="outline"
            >
              {isRunning ? (
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Tablet className="w-3 h-3 mr-2" />
              )}
              전체 테스트
            </Button>
          </div>

          {/* 빠른 액션 */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">빠른 액션:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => findOverflowElements()}
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
              >
                오버플로우 찾기
              </Button>
              <Button
                onClick={() => checkTouchTargets()}
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
              >
                터치 영역 체크
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsiveTestPanel;
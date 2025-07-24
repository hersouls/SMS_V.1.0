// 반응형 디버깅 유틸리티

export interface ScreenInfo {
  viewport: {
    width: number;
    height: number;
  };
  device: {
    width: number;
    height: number;
    ratio: number;
  };
  breakpoint: string;
  orientation: 'landscape' | 'portrait';
}

export interface OverflowElement {
  element: Element;
  tag: string;
  classes: string;
  scrollWidth: number;
  clientWidth: number;
  overflow: number;
}

export interface TouchTarget {
  element: Element;
  size: string;
  text: string;
}

export interface ImageStatus {
  total: number;
  loaded: number;
  failed: number;
  loading: number;
}

export interface LayoutHealthScore {
  screen: string;
  overflows: string;
  touchTargets: string;
  images: string;
}

// 현재 브레이크포인트 감지
export const getCurrentBreakpoint = (): string => {
  const width = window.innerWidth;
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
};

// 화면 정보 가져오기
export const getScreenInfo = (): ScreenInfo => {
  const info: ScreenInfo = {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    device: {
      width: window.screen.width,
      height: window.screen.height,
      ratio: window.devicePixelRatio
    },
    breakpoint: getCurrentBreakpoint(),
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  };
  
  console.log('📱 화면 정보:', info);
  return info;
};

// 오버플로우 요소 감지
export const findOverflowElements = (): OverflowElement[] => {
  const overflowing: OverflowElement[] = [];
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach((el) => {
    if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
      overflowing.push({
        element: el,
        tag: el.tagName,
        classes: el.className,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        overflow: el.scrollWidth - el.clientWidth
      });
    }
  });
  
  console.log('⚠️ 오버플로우 요소들:', overflowing);
  return overflowing;
};

// 터치 영역 크기 검사
export const checkTouchTargets = (): TouchTarget[] => {
  const tooSmall: TouchTarget[] = [];
  const buttons = document.querySelectorAll('button, a, [role="button"]');
  
  buttons.forEach((btn) => {
    const rect = btn.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    
    if (size < 44) { // 44px는 권장 최소 터치 크기
      tooSmall.push({
        element: btn,
        size: `${rect.width}x${rect.height}`,
        text: btn.textContent?.trim() || btn.getAttribute('aria-label') || 'No text'
      });
    }
  });
  
  console.log('👆 터치하기 어려운 요소들:', tooSmall);
  return tooSmall;
};

// 이미지 로딩 상태 확인
export const checkImageLoading = (): ImageStatus => {
  const images = document.querySelectorAll('img');
  const status: ImageStatus = {
    total: images.length,
    loaded: 0,
    failed: 0,
    loading: 0
  };
  
  images.forEach((img) => {
    if (img.complete) {
      if (img.naturalWidth === 0) {
        status.failed++;
      } else {
        status.loaded++;
      }
    } else {
      status.loading++;
    }
  });
  
  console.log('🖼️ 이미지 로딩 상태:', status);
  return status;
};

// 요소 겹침 감지
export const checkElementOverlap = (): Array<{element1: Element, element2: Element}> => {
  const overlapping: Array<{element1: Element, element2: Element}> = [];
  const elements = Array.from(document.querySelectorAll('*')).filter(el => 
    (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0
  );

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const rect1 = elements[i].getBoundingClientRect();
      const rect2 = elements[j].getBoundingClientRect();

      if (rect1.right > rect2.left && 
          rect1.left < rect2.right && 
          rect1.bottom > rect2.top && 
          rect1.top < rect2.bottom) {
        overlapping.push({ element1: elements[i], element2: elements[j] });
      }
    }
  }

  return overlapping;
};

// 전체 레이아웃 건강도 체크
export const healthCheck = (): LayoutHealthScore => {
  console.group('🏥 레이아웃 건강도 체크');
  
  const screenInfo = getScreenInfo();
  const overflows = findOverflowElements();
  const touchTargets = checkTouchTargets();
  const imageStatus = checkImageLoading();
  
  const score: LayoutHealthScore = {
    screen: screenInfo.breakpoint,
    overflows: overflows.length === 0 ? '✅' : `❌ ${overflows.length}개`,
    touchTargets: touchTargets.length === 0 ? '✅' : `❌ ${touchTargets.length}개`,
    images: imageStatus.failed === 0 ? '✅' : `❌ ${imageStatus.failed}개 실패`
  };
  
  console.log('종합 점수:', score);
  console.groupEnd();
  
  return score;
};

// 자동 반응형 테스트 실행
export const runResponsiveTests = () => {
  const testSizes = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14 Pro', width: 393, height: 852 },
    { name: 'iPad Air', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: '4K Monitor', width: 2560, height: 1440 }
  ];

  const results: Record<string, any> = {};

  testSizes.forEach((size) => {
    console.log(`\n🧪 ${size.name} (${size.width}x${size.height}) 테스트`);
    
    const issues: string[] = [];
    
    // 1. 가로 스크롤 체크
    if (document.body.scrollWidth > size.width) {
      issues.push(`가로 스크롤 발생 (${document.body.scrollWidth}px > ${size.width}px)`);
    }
    
    // 2. 텍스트 잘림 체크
    const truncatedElements = document.querySelectorAll('.truncate');
    if (truncatedElements.length > 0) {
      issues.push(`${truncatedElements.length}개 요소에서 텍스트 잘림`);
    }
    
    // 3. 겹침 요소 체크
    const overlapping = checkElementOverlap();
    if (overlapping.length > 0) {
      issues.push(`${overlapping.length}개 요소 겹침 발생`);
    }
    
    results[size.name] = {
      width: size.width,
      height: size.height,
      issues: issues,
      status: issues.length === 0 ? '✅ PASS' : '❌ FAIL'
    };
  });

  console.table(results);
  return results;
};

// 전역 디버깅 객체 생성
export const createDebugObject = () => {
  if (typeof window !== 'undefined') {
    (window as any).debugResponsive = {
      getScreenInfo,
      getCurrentBreakpoint,
      findOverflowElements,
      checkTouchTargets,
      checkImageLoading,
      healthCheck,
      runResponsiveTests
    };

    // 화면 크기 변경 감지
    window.addEventListener('resize', () => {
      console.log(`📐 화면 크기 변경: ${window.innerWidth}x${window.innerHeight} (${getCurrentBreakpoint()})`);
    });
  }
};
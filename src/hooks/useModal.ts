import { useState, useCallback, useRef, useEffect } from 'react';

export type ModalScreen = 'main' | 'add' | 'edit' | 'manage' | 'detail' | 'notifications' | 'alarm-history' | 'profile';

export interface ModalState<T = any> {
  currentScreen: ModalScreen;
  modalData: T | null;
  isOpen: boolean;
  history: ModalScreen[];
}

export const useModal = <T = any>(initialScreen: ModalScreen = 'main') => {
  const [state, setState] = useState<ModalState<T>>({
    currentScreen: initialScreen,
    modalData: null,
    isOpen: initialScreen !== 'main',
    history: [initialScreen]
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 모달 열기
  const openModal = useCallback((screen: ModalScreen, data?: T) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      currentScreen: screen,
      modalData: data || null,
      isOpen: true,
      history: [...prev.history, screen]
    }));
  }, []);

  // 모달 닫기
  const closeModal = useCallback(() => {
    if (!mountedRef.current) return;

    setState(prev => ({
      currentScreen: 'main',
      modalData: null,
      isOpen: false,
      history: prev.history.slice(0, -1)
    }));
  }, []);

  // 특정 화면으로 이동
  const navigateTo = useCallback((screen: ModalScreen, data?: T) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      currentScreen: screen,
      modalData: data || null,
      isOpen: screen !== 'main',
      history: screen === 'main' ? ['main'] : [...prev.history, screen]
    }));
  }, []);

  // 이전 화면으로 돌아가기
  const goBack = useCallback(() => {
    if (!mountedRef.current) return;

    setState(prev => {
      const newHistory = prev.history.slice(0, -1);
      const previousScreen = newHistory[newHistory.length - 1] || 'main';
      
      return {
        currentScreen: previousScreen,
        modalData: null,
        isOpen: previousScreen !== 'main',
        history: newHistory
      };
    });
  }, []);

  // 모달 데이터 업데이트
  const updateModalData = useCallback((data: T) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      modalData: data
    }));
  }, []);

  // 모달 상태 초기화
  const resetModal = useCallback(() => {
    if (!mountedRef.current) return;

    setState({
      currentScreen: 'main',
      modalData: null,
      isOpen: false,
      history: ['main']
    });
  }, []);

  // 현재 화면이 특정 화면인지 확인
  const isCurrentScreen = useCallback((screen: ModalScreen) => {
    return state.currentScreen === screen;
  }, [state.currentScreen]);

  // 모달이 열려있는지 확인
  const isModalOpen = state.isOpen;

  return {
    // 상태
    currentScreen: state.currentScreen,
    modalData: state.modalData,
    isOpen: state.isOpen,
    history: state.history,
    
    // 액션
    openModal,
    closeModal,
    navigateTo,
    goBack,
    updateModalData,
    resetModal,
    isCurrentScreen,
    isModalOpen
  };
};
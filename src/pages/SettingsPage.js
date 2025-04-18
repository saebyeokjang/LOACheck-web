// src/pages/SettingsPage.js - 설정 페이지
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import DataSyncService from '../services/DataSyncService';
import CharacterService from '../services/CharacterService';
import '../styles/SettingsPage.css';

function SettingsPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [isNetworkConnected, setIsNetworkConnected] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [characterCount, setCharacterCount] = useState(0);

  // 초기 데이터 로드
  useEffect(() => {
    const loadSettings = async () => {
      // 저장된 API 키 로드
      const savedApiKey = localStorage.getItem('apiKey') || '';
      setApiKey(savedApiKey);
      
      // 로그인 상태 체크
      const auth = await AuthService.getCurrentUser();
      setIsLoggedIn(!!auth);
      setUser(auth);
      
      // 자동 동기화 설정 로드
      const autoSyncSetting = localStorage.getItem('useAutoSync');
      setIsAutoSyncEnabled(autoSyncSetting === null ? true : autoSyncSetting === 'true');
      
      // 동기화 상태 로드
      const syncInfo = await DataSyncService.getSyncStatus();
      setHasPendingChanges(syncInfo.hasPendingChanges);
      
      // 네트워크 상태 모니터링
      checkNetworkStatus();
      window.addEventListener('online', checkNetworkStatus);
      window.addEventListener('offline', checkNetworkStatus);
      
      // 캐릭터 수 로드
      loadCharacterCount();
    };
    
    loadSettings();
    
    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);
  
  // 캐릭터 수 로드
  const loadCharacterCount = async () => {
    try {
      const characters = await CharacterService.fetchCharacters();
      setCharacterCount(characters.length);
    } catch (error) {
      console.error('캐릭터 정보 로드 오류:', error);
    }
  };
  
  // 네트워크 상태 체크
  const checkNetworkStatus = () => {
    setIsNetworkConnected(navigator.onLine);
  };
  
  // API 키 저장
  const saveApiKey = async () => {
    setLoading(true);
    
    try {
      // API 키 유효성 검사 호출
      const isValid = await CharacterService.validateApiKey(apiKey);
      
      if (isValid) {
        localStorage.setItem('apiKey', apiKey);
        showMessageWithTimeout('API 키가 저장되었습니다.', 'success');
        
        // 캐릭터 정보 새로고침
        refreshCharacters();
      } else {
        showMessageWithTimeout('유효하지 않은 API 키입니다.', 'error');
      }
    } catch (error) {
      showMessageWithTimeout('API 키 저장 중 오류가 발생했습니다.', 'error');
      console.error('API 키 저장 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 캐릭터 정보 새로고침
  const refreshCharacters = async () => {
    setLoading(true);
    
    try {
      await CharacterService.refreshCharactersFromAPI();
      showMessageWithTimeout('캐릭터 정보를 새로 불러왔습니다.', 'success');
      loadCharacterCount();
    } catch (error) {
      showMessageWithTimeout('캐릭터 정보를 불러오는데 실패했습니다.', 'error');
      console.error('캐릭터 새로고침 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 데이터 동기화
  const syncData = async () => {
    if (!isLoggedIn) {
      showMessageWithTimeout('동기화를 위해 로그인이 필요합니다.', 'warning');
      return;
    }
    
    if (!isNetworkConnected) {
      showMessageWithTimeout('네트워크 연결이 필요합니다.', 'warning');
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      await DataSyncService.performSync();
      setSyncStatus('success');
      setHasPendingChanges(false);
      showMessageWithTimeout('데이터 동기화가 완료되었습니다.', 'success');
    } catch (error) {
      setSyncStatus('error');
      showMessageWithTimeout('데이터 동기화 중 오류가 발생했습니다.', 'error');
      console.error('동기화 오류:', error);
    } finally {
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    }
  };
  
  // 자동 동기화 설정 변경
  const toggleAutoSync = () => {
    const newValue = !isAutoSyncEnabled;
    setIsAutoSyncEnabled(newValue);
    localStorage.setItem('useAutoSync', newValue.toString());
    DataSyncService.setAutoSync(newValue);
  };
  
  // 로그인/로그아웃
  const handleAuth = () => {
    if (isLoggedIn) {
      // 로그아웃 확인 모달
      setConfirmationMessage('로그아웃 하시겠습니까?');
      setConfirmationAction(() => logout);
      setShowConfirmation(true);
    } else {
      // 로그인 모달 표시
      setShowSignInModal(true);
    }
  };
  
  // 로그아웃 처리
  const logout = async () => {
    try {
      await AuthService.signOut();
      setIsLoggedIn(false);
      setUser(null);
      showMessageWithTimeout('로그아웃되었습니다.', 'success');
    } catch (error) {
      showMessageWithTimeout('로그아웃 중 오류가 발생했습니다.', 'error');
      console.error('로그아웃 오류:', error);
    }
  };
  
  // 데이터 초기화
  const resetData = () => {
    setConfirmationMessage('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    setConfirmationAction(() => performDataReset);
    setShowConfirmation(true);
  };
  
  // 데이터 초기화 실행
  const performDataReset = async () => {
    setLoading(true);
    
    try {
      await CharacterService.resetAllData();
      
      // 데이터 변경 표시
      DataSyncService.markLocalChanges();
      
      // 자동 동기화 설정이 켜져 있고 로그인 상태면 데이터 동기화
      if (isAutoSyncEnabled && isLoggedIn && isNetworkConnected) {
        await DataSyncService.performSync();
      }
      
      showMessageWithTimeout('모든 데이터가 초기화되었습니다.', 'success');
      setCharacterCount(0);
    } catch (error) {
      showMessageWithTimeout('데이터 초기화 중 오류가 발생했습니다.', 'error');
      console.error('데이터 초기화 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 알림 메시지 표시 (자동 사라짐)
  const showMessageWithTimeout = (msg, type = 'info') => {
    setMessage({ text: msg, type });
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  };
  
  // 로그인 모달 닫기
  const handleSignInClose = (success = false) => {
    setShowSignInModal(false);
    
    if (success) {
      // 로그인 성공 시 사용자 정보 갱신
      AuthService.getCurrentUser().then(user => {
        setIsLoggedIn(true);
        setUser(user);
        showMessageWithTimeout('로그인되었습니다.', 'success');
      });
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>설정</h2>
      </div>
      
      {/* 알림 메시지 */}
      {showMessage && (
        <div className={`message-toast ${message.type}`}>
          <span className="material-icons">
            {message.type === 'success' ? 'check_circle' : 
             message.type === 'error' ? 'error' : 
             message.type === 'warning' ? 'warning' : 'info'}
          </span>
          <span>{message.text}</span>
        </div>
      )}
      
      {/* 오프라인 상태 알림 */}
      {!isNetworkConnected && (
        <div className="offline-alert">
          <span className="material-icons">wifi_off</span>
          <span>오프라인 상태입니다. 일부 기능이 제한됩니다.</span>
        </div>
      )}
      
      <div className="settings-sections">
        {/* 계정 섹션 */}
        <section className="settings-section">
          <h3 className="section-title">계정</h3>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">계정 상태</div>
                <div className="setting-description">
                  {isLoggedIn 
                    ? `${user?.displayName || '사용자'}로 로그인됨` 
                    : '로그인되지 않음'}
                </div>
              </div>
              <button 
                className={`action-button ${isLoggedIn ? 'secondary' : 'primary'}`}
                onClick={handleAuth}
              >
                {isLoggedIn ? '로그아웃' : '로그인'}
              </button>
            </div>
            
            {isLoggedIn && (
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-title">데이터 동기화</div>
                  <div className="setting-description">
                    {hasPendingChanges 
                      ? '동기화되지 않은 변경사항이 있습니다'
                      : '모든 데이터가 동기화되었습니다'}
                  </div>
                </div>
                <button 
                  className={`sync-button ${syncStatus}`}
                  onClick={syncData}
                  disabled={syncStatus === 'syncing' || !isNetworkConnected}
                >
                  {syncStatus === 'syncing' ? (
                    <span className="material-icons spinning">sync</span>
                  ) : (
                    <span className="material-icons">sync</span>
                  )}
                  동기화
                </button>
              </div>
            )}
            
            {isLoggedIn && (
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-title">자동 동기화</div>
                  <div className="setting-description">
                    데이터 변경 시 자동으로 동기화합니다
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isAutoSyncEnabled}
                    onChange={toggleAutoSync}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            )}
          </div>
        </section>
        
        {/* API 설정 섹션 */}
        <section className="settings-section">
          <h3 className="section-title">API 설정</h3>
          <div className="settings-card">
            <div className="setting-item column">
              <div className="setting-info">
                <div className="setting-title">로스트아크 API 키</div>
                <div className="setting-description">
                  <a 
                    href="https://developer-lostark.game.onstove.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    로스트아크 개발자 포털
                  </a>
                  에서 발급받은 API 키를 입력하세요
                </div>
              </div>
              <div className="api-key-input">
                <input 
                  type="text" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API 키 입력"
                />
                <button 
                  className="action-button primary"
                  onClick={saveApiKey}
                  disabled={!apiKey || loading}
                >
                  {loading ? (
                    <span className="material-icons spinning">sync</span>
                  ) : (
                    '저장'
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* 데이터 관리 섹션 */}
        <section className="settings-section">
          <h3 className="section-title">데이터 관리</h3>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">캐릭터 정보 갱신</div>
                <div className="setting-description">
                  API를 통해 최신 캐릭터 정보를 가져옵니다
                </div>
              </div>
              <button 
                className="action-button primary"
                onClick={refreshCharacters}
                disabled={!apiKey || loading || !isNetworkConnected}
              >
                {loading ? (
                  <span className="material-icons spinning">sync</span>
                ) : (
                  '갱신'
                )}
              </button>
            </div>
            
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">데이터 초기화</div>
                <div className="setting-description danger">
                  모든 캐릭터 데이터를 영구적으로 삭제합니다 (총 {characterCount}개)
                </div>
              </div>
              <button 
                className="action-button danger"
                onClick={resetData}
                disabled={loading || characterCount === 0}
              >
                초기화
              </button>
            </div>
          </div>
        </section>
        
        {/* 앱 정보 섹션 */}
        <section className="settings-section">
          <h3 className="section-title">앱 정보</h3>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">버전</div>
                <div className="setting-description">1.0.0</div>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">만든이</div>
                <div className="setting-description">웹 버전 - Anthropic Claude</div>
              </div>
            </div>
            
            <div className="setting-item column">
              <div className="setting-info">
                <div className="setting-title">라이선스</div>
                <div className="setting-description">
                  이 프로젝트는 MIT 라이선스 하에 제공됩니다.<br />
                  로스트아크는 스마일게이트 RPG의
                  등록상표이며, 본 앱은 공식 앱이 아닙니다.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* 확인 모달 */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h4>확인</h4>
            <p>{confirmationMessage}</p>
            <div className="modal-actions">
              <button 
                className="action-button secondary"
                onClick={() => setShowConfirmation(false)}
              >
                취소
              </button>
              <button 
                className="action-button danger"
                onClick={() => {
                  confirmationAction();
                  setShowConfirmation(false);
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 로그인 모달 (실제 구현은 별도 컴포넌트로 분리하는 것이 좋음) */}
      {showSignInModal && (
        <div className="modal-overlay">
          <div className="sign-in-modal">
            <h4>로그인</h4>
            <p>계정으로 로그인하여 데이터를 동기화하세요</p>
            {/* 여기에 로그인 폼 또는 소셜 로그인 버튼들 */}
            <div className="social-login-buttons">
              <button className="google-login-button">
                Google 계정으로 로그인
              </button>
              <button className="apple-login-button">
                Apple 계정으로 로그인
              </button>
            </div>
            <div className="modal-actions">
              <button 
                className="action-button secondary"
                onClick={() => handleSignInClose()}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
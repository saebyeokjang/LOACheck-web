// src/pages/SignInPage.js - 로그인 페이지
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import '../styles/SignInPage.css';

function SignInPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const result = await AuthService.signInWithGoogle();
      
      if (result.success) {
        navigate('/');
      } else {
        setErrorMessage('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      setErrorMessage('로그인 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const result = await AuthService.signInWithApple();
      
      if (result.success) {
        navigate('/');
      } else {
        setErrorMessage('Apple 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      setErrorMessage('로그인 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigate('/');
  };

  return (
    <div className="signin-container">
      <div className="signin-content">
        <div className="logo-section">
          <img src="/ic_launcher.png" alt="LOA Check Logo" className="logo" />
          <h1>LOA Check</h1>
          <p>로그인하여 친구와 진행 상황을 공유하세요</p>
        </div>

        <div className="signin-buttons">
          {/* Apple 로그인 버튼 */}
          <button 
            className="signin-button apple-button"
            onClick={handleAppleSignIn}
            disabled={loading}
          >
            <img src="/apple_logo.png" alt="Apple" className="button-icon" />
            <span>Apple로 로그인</span>
          </button>

          {/* Google 로그인 버튼 */}
          <button 
            className="signin-button google-button"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img src="/google_logo.png" alt="Google" className="button-icon" />
            <span>Google로 로그인</span>
          </button>

          {/* 비회원 사용 버튼 */}
          <button 
            className="signin-button guest-button"
            onClick={handleContinueAsGuest}
            disabled={loading}
          >
            <span>비회원으로 계속하기</span>
          </button>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>로그인 중...</p>
          </div>
        )}

        <div className="terms-section">
          <p>
            로그인 시 <a href="#">이용약관</a> 및 <a href="#">개인정보 처리방침</a>에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
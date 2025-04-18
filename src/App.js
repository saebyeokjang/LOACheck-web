// src/App.js - 메인 앱 컴포넌트
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// 페이지 컴포넌트 임포트
import SignInPage from './pages/SignInPage';
import HomePage from './pages/HomePage';
import CharacterListPage from './pages/CharacterListPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import GoldSummaryPage from './pages/GoldSummaryPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';

// 스타일 임포트
import './App.css';
import './styles/index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Firebase 인증 상태 변경 구독
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      setInitialized(true);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  // 로그인 필요한 라우트를 위한 보호 래퍼
  const ProtectedRoute = ({ children }) => {
    if (!initialized) return <div className="loading-container">
      <div className="spinner"></div>
      <p>로딩 중...</p>
    </div>;
    
    // 로컬 스토리지 확인하여 게스트 모드 확인
    const isGuestMode = localStorage.getItem('guestMode') === 'true';
    
    if (!currentUser && !isGuestMode) {
      return <Navigate to="/signin" />;
    }
    
    return children;
  };

  if (!initialized) {
    return <div className="loading-container">
      <div className="spinner"></div>
      <p>앱을 초기화하는 중...</p>
    </div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={
          (currentUser || localStorage.getItem('guestMode') === 'true') 
            ? <Navigate to="/" /> 
            : <SignInPage />
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <HomePage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/characters" element={
          <ProtectedRoute>
            <Layout>
              <CharacterListPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/characters/:characterName" element={
          <ProtectedRoute>
            <Layout>
              <CharacterDetailPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/gold" element={
          <ProtectedRoute>
            <Layout>
              <GoldSummaryPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 404 페이지 - 모든 경로에 매치되지 않는 경우 */}
        <Route path="*" element={
          <Navigate to="/" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
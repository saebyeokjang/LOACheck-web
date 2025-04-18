// src/App.js - 메인 앱 컴포넌트
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthService from './services/AuthService';

// 페이지 컴포넌트 임포트
import SignInPage from './pages/SignInPage';
import HomePage from './pages/HomePage';
import CharacterListPage from './pages/CharacterListPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import GoldSummaryPage from './pages/GoldSummaryPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 변경 구독
    const unsubscribe = AuthService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  // 로그인 필요한 라우트를 위한 보호 래퍼
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="loading">로딩 중...</div>;
    if (!currentUser) return <Navigate to="/signin" />;
    return children;
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={
          currentUser ? <Navigate to="/" /> : <SignInPage />
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
      </Routes>
    </Router>
  );
}

export default App;
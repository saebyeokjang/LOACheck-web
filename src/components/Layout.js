// src/components/Layout.js - 레이아웃 컴포넌트
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthService from '../services/AuthService';
import '../styles/Layout.css';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const result = await AuthService.signOut();
    if (result.success) {
      navigate('/signin');
    } else {
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const menuItems = [
    { path: '/', label: '홈', icon: 'home' },
    { path: '/characters', label: '캐릭터', icon: 'person' },
    { path: '/gold', label: '주간 골드', icon: 'attach_money' },
    { path: '/settings', label: '설정', icon: 'settings' }
  ];

  return (
    <div className="layout">
      {/* 헤더 */}
      <header className="header">
        <div className="header-left">
          <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className="material-icons">menu</span>
          </button>
          <h1>LOA Check Web</h1>
        </div>
        <div className="header-right">
          <button className="signout-button" onClick={handleSignOut}>
            <span className="material-icons">logout</span>
          </button>
        </div>
      </header>

      {/* 사이드 메뉴 */}
      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <div className="user-info">
            <span className="material-icons">account_circle</span>
            <span>{AuthService.getCurrentUser()?.displayName || '사용자'}</span>
          </div>
          <button className="close-menu" onClick={() => setIsMenuOpen(false)}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <nav className="menu-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="material-icons">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="main-content">
        {children}
      </main>

      {/* 탭 바 */}
      <div className="tab-bar">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={location.pathname === item.path ? 'active' : ''}
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Layout;
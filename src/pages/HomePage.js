// src/pages/HomePage.js - 홈 페이지
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CharacterService from '../services/CharacterService';
import '../styles/HomePage.css';

function HomePage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [goldStats, setGoldStats] = useState({ total: 0, earned: 0 });
  
  // 선택된 캐릭터
  const currentCharacter = characters.length > 0 ? characters[currentCharacterIndex] : null;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const characterData = await CharacterService.fetchCharacters();
        
        if (characterData.length > 0) {
          setCharacters(characterData);
          
          // 골드 통계 계산
          const goldCalc = CharacterService.calculateWeeklyGold(characterData);
          setGoldStats(goldCalc);
        }
        
        setError(null);
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
        console.error('데이터 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 이전 캐릭터로 이동
  const goToPreviousCharacter = () => {
    if (currentCharacterIndex > 0) {
      setCurrentCharacterIndex(prev => prev - 1);
    }
  };

  // 다음 캐릭터로 이동
  const goToNextCharacter = () => {
    if (currentCharacterIndex < characters.length - 1) {
      setCurrentCharacterIndex(prev => prev + 1);
    }
  };

  // 일일 컨텐츠 이름 포맷팅 (캐릭터 레벨에 따라)
  const formatTaskName = (taskType, level) => {
    if (taskType === '카오스 던전' && level >= 1640) {
      return '쿠르잔 전선';
    }
    return taskType;
  };

  // 주간 레이드 완료도 계산
  const calculateRaidCompletion = (raidGates) => {
    if (!raidGates || raidGates.length === 0) return { completed: 0, total: 0 };
    
    const completedGates = raidGates.filter(gate => gate.isCompleted).length;
    return {
      completed: completedGates,
      total: raidGates.length,
      percentage: Math.round((completedGates / raidGates.length) * 100)
    };
  };

  // 일일 숙제 완료도 계산
  const calculateDailyCompletion = (dailyTasks) => {
    if (!dailyTasks || dailyTasks.length === 0) return { completed: 0, total: 0 };
    
    let completed = 0;
    let total = 0;
    
    dailyTasks.forEach(task => {
      switch (task.type) {
        case '에포나 의뢰':
          completed += task.completionCount;
          total += 3; // 에포나는 최대 3회
          break;
        default:
          if (task.completionCount > 0) completed += 1;
          total += 1;
      }
    });
    
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <span className="material-icons">error</span>
        <p>{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="empty-characters">
        <span className="material-icons">person_off</span>
        <h2>표시할 캐릭터가 없습니다</h2>
        <p>API 키를 등록하여 캐릭터를 불러오거나 숨김 처리된 캐릭터를 확인해보세요.</p>
        <Link to="/settings" className="settings-link">
          <span className="material-icons">settings</span>
          <span>설정으로 이동</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* 상단 골드 요약 */}
      <div className="gold-summary-card">
        <div className="gold-summary-header">
          <h3>주간 획득 골드</h3>
          <Link to="/gold" className="view-details">
            자세히 보기
            <span className="material-icons">chevron_right</span>
          </Link>
        </div>
        <div className="gold-summary-content">
          <div className="gold-stat">
            <span className="gold-label">현재 획득</span>
            <span className="gold-value earned">{goldStats.earned} G</span>
          </div>
          <div className="gold-divider"></div>
          <div className="gold-stat">
            <span className="gold-label">총 예상</span>
            <span className="gold-value total">{goldStats.total} G</span>
          </div>
        </div>
      </div>

      {/* 캐릭터 슬라이더 */}
      {currentCharacter && (
        <div className="character-slider">
          <div className="character-navigation">
            <button
              className={`nav-button ${currentCharacterIndex === 0 ? 'disabled' : ''}`}
              onClick={goToPreviousCharacter}
              disabled={currentCharacterIndex === 0}
            >
              <span className="material-icons">chevron_left</span>
            </button>
            
            <div className="character-title">
              <h2>{currentCharacter.name}</h2>
              <p>{currentCharacter.server} • {currentCharacter.characterClass}</p>
              <span className="character-level">레벨: {currentCharacter.level.toFixed(2)}</span>
              
              {currentCharacter.isGoldEarner && (
                <div className="gold-earner-badge">
                  <span className="material-icons">monetization_on</span>
                  <span>골드 획득 캐릭터</span>
                </div>
              )}
            </div>
            
            <button
              className={`nav-button ${currentCharacterIndex === characters.length - 1 ? 'disabled' : ''}`}
              onClick={goToNextCharacter}
              disabled={currentCharacterIndex === characters.length - 1}
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>

          {/* 컨텐츠 진행 상황 */}
          <div className="content-progress">
            {/* 일일 숙제 진행 상황 */}
            {currentCharacter.dailyTasks && currentCharacter.dailyTasks.length > 0 && (
              <div className="progress-section">
                <div className="section-header">
                  <h3>일일 숙제</h3>
                  <span className="completion-badge">
                    {calculateDailyCompletion(currentCharacter.dailyTasks).percentage}%
                  </span>
                </div>
                
                <div className="tasks-container">
                  {currentCharacter.dailyTasks.map((task, index) => (
                    <div className="task-item" key={index}>
                      <div className="task-header">
                        <span className="task-name">
                          {formatTaskName(task.type, currentCharacter.level)}
                        </span>
                        
                        <span className="task-completion">
                          {task.type === '에포나 의뢰' 
                            ? `${task.completionCount}/3` 
                            : task.completionCount > 0 ? '완료' : '미완료'}
                        </span>
                      </div>
                      
                      <div className="resting-points-bar">
                        <div 
                          className="resting-filled"
                          style={{ 
                            width: `${(task.restingPoints / task.type.maxRestingPoints) * 100}%`,
                            backgroundColor: getRestingColor(task.restingPoints, task.type.maxRestingPoints)
                          }}
                        ></div>
                      </div>
                      
                      <div className="resting-info">
                        <span className="material-icons small">hotel</span>
                        <span className="resting-text">
                          {task.restingPoints}/{task.type.maxRestingPoints}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 주간 레이드 진행 상황 */}
            {currentCharacter.raidGates && currentCharacter.raidGates.length > 0 && (
              <div className="progress-section">
                <div className="section-header">
                  <h3>주간 레이드</h3>
                  <span className="completion-badge">
                    {calculateRaidCompletion(currentCharacter.raidGates).percentage}%
                  </span>
                </div>
                
                <div className="raid-summary">
                  <p>
                    <span className="material-icons">task_alt</span>
                    <span>
                      {calculateRaidCompletion(currentCharacter.raidGates).completed}/
                      {calculateRaidCompletion(currentCharacter.raidGates).total} 관문 완료
                    </span>
                  </p>
                  
                  {currentCharacter.isGoldEarner && (
                    <p>
                      <span className="material-icons">monetization_on</span>
                      <span>
                        {currentCharacter.raidGates
                          .filter(gate => gate.isCompleted && !gate.isGoldDisabled)
                          .reduce((sum, gate) => sum + gate.goldReward, 0)} G 획득
                      </span>
                    </p>
                  )}
                </div>
                
                <Link to={`/characters/${currentCharacter.name}`} className="view-details-link">
                  <span>자세히 보기</span>
                  <span className="material-icons">arrow_forward</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 다른 캐릭터로 바로가기 */}
      <div className="character-quick-nav">
        <h3>다른 캐릭터 바로가기</h3>
        <div className="character-list">
          {characters.map((character, index) => (
            <button
              key={character.name}
              className={`character-button ${index === currentCharacterIndex ? 'active' : ''}`}
              onClick={() => setCurrentCharacterIndex(index)}
            >
              <div className="character-avatar">
                {character.name.charAt(0)}
              </div>
              <div className="character-quick-info">
                <span className="character-name">{character.name}</span>
                <span className="character-level">Lv.{character.level.toFixed(0)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 휴식 게이지 색상 계산 함수
function getRestingColor(current, max) {
  const percentage = current / max;
  if (percentage < 0.25) return '#4caf50';
  if (percentage < 0.5) return '#8bc34a';
  if (percentage < 0.75) return '#ffc107';
  return '#ff9800';
}

export default HomePage;
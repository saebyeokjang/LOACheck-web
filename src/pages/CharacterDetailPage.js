// src/pages/CharacterDetailPage.js - 캐릭터 상세 페이지
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CharacterService from '../services/CharacterService';
import '../styles/CharacterDetailPage.css';

// 휴식 게이지 최대값 정의
const REST_MAX_POINTS = {
  "카오스 던전": 200,
  "가디언 토벌": 200,
  "에포나 의뢰": 100
};

function CharacterDetailPage() {
  const { characterName } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadCharacterDetails() {
      try {
        setLoading(true);
        const characterData = await CharacterService.fetchCharacterDetails(characterName);
        
        if (characterData) {
          setCharacter(characterData);
          setError(null);
        } else {
          setError('캐릭터 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('캐릭터 정보를 불러오는 데 실패했습니다.');
        console.error('캐릭터 상세정보 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    }

    if (characterName) {
      loadCharacterDetails();
    }
  }, [characterName]);

  // 일일 컨텐츠 이름 포맷팅 (캐릭터 레벨에 따라)
  const formatTaskName = (taskType) => {
    if (!character) return taskType;
    
    if (taskType === '카오스 던전' && character.level >= 1640) {
      return '쿠르잔 전선';
    }
    return taskType;
  };

  // 주간 레이드 완료도 계산
  const calculateRaidCompletion = (raidGates) => {
    if (!raidGates || raidGates.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completedGates = raidGates.filter(gate => gate.isCompleted).length;
    return {
      completed: completedGates,
      total: raidGates.length,
      percentage: Math.round((completedGates / raidGates.length) * 100)
    };
  };

  // 레이드별로 그룹화
  const getRaidGroups = () => {
    if (!character?.raidGates || character.raidGates.length === 0) return [];
    
    // 레이드별로 그룹화
    const raidGroups = {};
    for (const gate of character.raidGates) {
      if (!raidGroups[gate.raid]) {
        raidGroups[gate.raid] = [];
      }
      raidGroups[gate.raid].push(gate);
    }
    
    // 객체를 배열로 변환
    return Object.entries(raidGroups).map(([raid, gates]) => ({
      name: raid,
      gates: gates.sort((a, b) => a.gate - b.gate),
      completed: gates.filter(gate => gate.isCompleted).length,
      total: gates.length
    }));
  };

  // 휴식 게이지 색상 계산 함수
  const getRestingColor = (current, max) => {
    const percentage = max > 0 ? current / max : 0;
    if (percentage < 0.25) return '#4caf50';
    if (percentage < 0.5) return '#8bc34a';
    if (percentage < 0.75) return '#ffc107';
    return '#ff9800';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>캐릭터 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <span className="material-icons">error</span>
        <p>{error}</p>
        <Link to="/characters" className="back-link">
          <span className="material-icons">arrow_back</span>
          캐릭터 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="empty-character">
        <span className="material-icons">person_off</span>
        <p>캐릭터 정보가 없습니다.</p>
        <Link to="/characters" className="back-link">
          <span className="material-icons">arrow_back</span>
          캐릭터 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="character-detail-page">
      <div className="page-header">
        <Link to="/characters" className="back-button">
          <span className="material-icons">arrow_back</span>
        </Link>
        <h2>캐릭터 상세</h2>
      </div>

      {/* 캐릭터 기본 정보 카드 */}
      <div className="character-card">
        <div className="character-header">
          <h3>{character.name}</h3>
          <div className="character-info">
            <span className="server-class">{character.server} • {character.characterClass}</span>
            <span className="level">레벨: {character.level.toFixed(2)}</span>
            
            {character.isGoldEarner && (
              <div className="gold-earner-badge">
                <span className="material-icons">monetization_on</span>
                <span>골드 획득 캐릭터</span>
              </div>
            )}
          </div>
        </div>

        {/* 일일 숙제 섹션 */}
        {character.dailyTasks && character.dailyTasks.length > 0 && (
          <div className="section daily-tasks-section">
            <div className="section-header">
              <h4>일일 숙제</h4>
            </div>
            
            <div className="tasks-list">
              {character.dailyTasks.map((task, index) => {
                // 컨텐츠별 휴식 게이지 최대값 설정
                const maxRestingPoints = task.maxRestingPoints || REST_MAX_POINTS[task.type] || 100;
                
                return (
                  <div className="task-item" key={index}>
                    <div className="task-header">
                      <span className="task-name">{formatTaskName(task.type)}</span>
                      <span className="task-status">
                        {task.type === '에포나 의뢰' 
                          ? `${task.completionCount || 0}/3` 
                          : (task.completionCount || 0) > 0 ? '완료' : '미완료'}
                      </span>
                    </div>
                    
                    <div className="rest-bonus-bar">
                      <div 
                        className="rest-filled"
                        style={{ 
                          width: `${maxRestingPoints > 0 ? (task.restingPoints / maxRestingPoints) * 100 : 0}%`,
                          backgroundColor: getRestingColor(task.restingPoints, maxRestingPoints)
                        }}
                      ></div>
                    </div>
                    
                    <div className="rest-info">
                      <span className="material-icons small">hotel</span>
                      <span className="rest-text">
                        {task.restingPoints || 0}/{maxRestingPoints}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 주간 레이드 섹션 */}
        {character.raidGates && character.raidGates.length > 0 && (
          <div className="section raids-section">
            <div className="section-header">
              <h4>주간 레이드</h4>
              <span className="completion-badge">
                {calculateRaidCompletion(character.raidGates).percentage}%
              </span>
            </div>
            
            <div className="raids-list">
              {getRaidGroups().map((raid) => (
                <div className="raid-item" key={raid.name}>
                  <div className="raid-header">
                    <span className="raid-name">{raid.name}</span>
                    <span className="raid-progress">
                      {raid.completed}/{raid.total} 관문
                    </span>
                  </div>
                  
                  <div className="gates-grid">
                    {raid.gates.map((gate) => (
                      <div 
                        key={gate.gate} 
                        className={`gate-item ${gate.isCompleted ? 'completed' : ''}`}
                      >
                        <div className="gate-info">
                          <span className="gate-number">{gate.gate + 1}관문</span>
                          <span className="gate-difficulty">{gate.difficulty || '노멀'}</span>
                        </div>
                        
                        <div className="gate-status">
                          {gate.isCompleted ? (
                            <span className="material-icons status-icon completed">check_circle</span>
                          ) : (
                            <span className="material-icons status-icon">radio_button_unchecked</span>
                          )}
                        </div>
                        
                        {character.isGoldEarner && !gate.isGoldDisabled && (
                          <div className="gate-gold">
                            <span className="material-icons gold-icon">monetization_on</span>
                            <span className="gold-amount">{gate.goldReward || 0}G</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 골드 획득 캐릭터가 아닌 경우 알림 */}
            {!character.isGoldEarner && (
              <div className="no-gold-warning">
                <span className="material-icons">info</span>
                <p>골드 획득 캐릭터로 지정되지 않아 골드를 획득할 수 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterDetailPage;
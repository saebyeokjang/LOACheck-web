// src/pages/GoldSummaryPage.js - 골드 요약 페이지
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CharacterService from '../services/CharacterService';
import '../styles/GoldSummaryPage.css';

function GoldSummaryPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goldStats, setGoldStats] = useState({ total: 0, earned: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const characterData = await CharacterService.fetchCharacters();
        
        // 골드 획득 캐릭터만 필터링하고 레벨 기준 정렬
        const goldEarners = characterData
          .filter(char => char.isGoldEarner)
          .sort((a, b) => b.level - a.level);
        
        setCharacters(goldEarners);
        
        // 골드 통계 계산
        const goldCalc = CharacterService.calculateWeeklyGold(characterData);
        setGoldStats(goldCalc);
        
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

  // 레이드 목록과 완료 관문 정보 가져오기
  const getRaidSummary = (character) => {
    if (!character.raidGates || character.raidGates.length === 0) {
      return [];
    }
    
    // 레이드별로 그룹화
    const raidGroups = {};
    for (const gate of character.raidGates) {
      if (!raidGroups[gate.raid]) {
        raidGroups[gate.raid] = {
          name: gate.raid,
          gates: [],
          totalGold: 0,
          earnedGold: 0,
          completed: 0,
          total: 0,
          isGoldDisabled: gate.isGoldDisabled
        };
      }
      
      raidGroups[gate.raid].gates.push(gate);
      raidGroups[gate.raid].total += 1;
      
      if (!gate.isGoldDisabled) {
        raidGroups[gate.raid].totalGold += gate.goldReward;
        
        if (gate.isCompleted) {
          raidGroups[gate.raid].earnedGold += gate.goldReward;
          raidGroups[gate.raid].completed += 1;
        }
      }
    }
    
    // 상위 3개 레이드 계산 (골드 높은 순)
    let sortedRaids = Object.values(raidGroups)
      .sort((a, b) => b.totalGold - a.totalGold);
    
    const topRaids = sortedRaids.slice(0, 3).map(raid => raid.name);
    
    // 각 레이드에 상위 레이드 여부 표시
    sortedRaids.forEach(raid => {
      raid.isTopRaid = topRaids.includes(raid.name);
    });
    
    // 추가 골드 정보 적용
    try {
      const additionalGoldMap = JSON.parse(character.additionalGoldMap || "{}");
      
      sortedRaids.forEach(raid => {
        const additionalGold = additionalGoldMap[raid.name] || 0;
        
        if (additionalGold > 0) {
          raid.additionalGold = additionalGold;
          raid.totalGold += additionalGold;
          
          // 하나라도 완료된 관문이 있으면 추가 골드 획득한 것으로 처리
          if (raid.completed > 0) {
            raid.earnedGold += additionalGold;
          }
        }
      });
    } catch (error) {
      console.error("추가 골드 파싱 오류:", error);
    }
    
    // 레이드 이름 기준 또는 골드 기준 내림차순 정렬
    return sortedRaids;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>골드 정보를 불러오는 중...</p>
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

  return (
    <div className="gold-summary-page">
      <div className="page-header">
        <h2>주간 획득 골드</h2>
      </div>

      {/* 총 예상 골드 섹션 */}
      <div className="total-gold-section">
        <div className="gold-header">
          <h3>주간 예상 골드 수익</h3>
        </div>
        
        <div className="gold-stats">
          <div className="gold-stat-item">
            <span className="stat-label">현재 획득 골드</span>
            <span className="stat-value earned">{goldStats.earned} G</span>
          </div>
          
          <div className="gold-stat-item">
            <span className="stat-label">총 예상 골드</span>
            <span className="stat-value total">{goldStats.total} G</span>
          </div>
        </div>
      </div>

      {/* 골드 획득 캐릭터가 없는 경우 */}
      {characters.length === 0 && (
        <div className="empty-gold-earners">
          <span className="material-icons">monetization_on</span>
          <p>골드 획득 캐릭터가 없습니다</p>
          <Link to="/characters" className="character-link">
            <span className="material-icons">person</span>
            <span>캐릭터 목록 확인하기</span>
          </Link>
        </div>
      )}

      {/* 캐릭터별 골드 내역 */}
      <div className="character-gold-section">
        <h3>캐릭터별 골드 내역</h3>
        
        <div className="character-list">
          {characters.map(character => {
            // 캐릭터별 획득 골드 및 예상 골드 계산
            const raidSummary = getRaidSummary(character);
            const earnedGold = raidSummary.reduce((sum, raid) => sum + raid.earnedGold, 0);
            const totalGold = raidSummary.reduce((sum, raid) => sum + raid.totalGold, 0);
            
            return (
              <div className="character-gold-card" key={character.name}>
                {/* 캐릭터 기본 정보 */}
                <div className="character-header">
                  <div className="character-info">
                    <h4>{character.name}</h4>
                    <p className="character-details">
                      {character.server} • {character.characterClass} • Lv.{character.level.toFixed(0)}
                    </p>
                  </div>
                  
                  <div className="character-gold">
                    <span className="gold-value">{earnedGold} / {totalGold} G</span>
                  </div>
                </div>
                
                {/* 레이드 정보 */}
                <div className="raid-list">
                  {raidSummary.map(raid => (
                    <div className="raid-item" key={raid.name}>
                      <div className="raid-info">
                        <div className="raid-name">
                          <span>{raid.name}</span>
                          <span className="raid-progress">
                            {raid.completed}/{raid.total} 관문
                          </span>
                        </div>
                        
                        <div className="raid-gold">
                          {raid.isTopRaid && !raid.isGoldDisabled ? (
                            <span className="gold-value top-raid">
                              {raid.earnedGold} / {raid.totalGold} G
                              {raid.additionalGold ? ` (+${raid.additionalGold})` : ''}
                            </span>
                          ) : raid.additionalGold ? (
                            <span className="gold-value add-only">
                              {raid.completed > 0 ? raid.additionalGold : 0} / {raid.additionalGold} G
                              <span className="add-gold">(+{raid.additionalGold})</span>
                            </span>
                          ) : (
                            <span className="gold-value disabled">
                              0 / 0 G
                              <span className="no-gold">(골드 보상 없음)</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 관문 표시 */}
                      <div className="gate-indicators">
                        {raid.gates.map((gate, index) => (
                          <div 
                            key={index}
                            className={`gate ${gate.isCompleted ? 'completed' : ''}`}
                            title={`${gate.raid} ${gate.gate + 1}관문 (${gate.difficulty})`}
                          >
                            {gate.gate + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="info-section">
        <p>
          캐릭터당 골드 보상이 높은 최대 3개 레이드에서만 골드를 획득할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default GoldSummaryPage;
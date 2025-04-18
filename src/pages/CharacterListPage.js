// src/pages/CharacterListPage.js - 캐릭터 목록 페이지
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CharacterService from '../services/CharacterService';
import '../styles/CharacterListPage.css';

function CharacterListPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    async function loadCharacters() {
      try {
        setLoading(true);
        const characterData = await CharacterService.fetchCharacters();
        setCharacters(characterData);
        setError(null);
      } catch (err) {
        setError('캐릭터 목록을 불러오는 데 실패했습니다.');
        console.error('캐릭터 목록 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCharacters();
  }, []);

  // 검색 필터링
  const filteredCharacters = characters.filter(character => {
    if (searchText === '') return true;
    
    const searchLower = searchText.toLowerCase();
    return (
      character.name.toLowerCase().includes(searchLower) ||
      character.server.toLowerCase().includes(searchLower) ||
      character.characterClass.toLowerCase().includes(searchLower)
    );
  });

  // 캐릭터 관리 통계
  const stats = {
    totalCharacters: characters.length,
    visibleCharacters: characters.filter(c => !c.isHidden).length,
    goldEarners: characters.filter(c => c.isGoldEarner).length
  };

  return (
    <div className="character-list-page">
      <div className="page-header">
        <h2>캐릭터 관리</h2>
        
        <div className="search-bar">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="캐릭터 검색..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button className="clear-search" onClick={() => setSearchText('')}>
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>캐릭터 정보를 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <span className="material-icons">error</span>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredCharacters.length === 0 && (
        <div className="empty-characters">
          <span className="material-icons">person_off</span>
          <p>표시할 캐릭터가 없습니다.</p>
          {searchText && <p>검색 조건을 변경해 보세요.</p>}
        </div>
      )}

      <div className="character-list">
        {filteredCharacters.map(character => (
          <Link 
            to={`/characters/${character.name}`} 
            className="character-card" 
            key={character.name}
          >
            <div className="character-info">
              <h3>{character.name}</h3>
              <p className="character-details">
                {character.server} • {character.characterClass}
              </p>
              <p className="character-level">
                레벨: {character.level.toFixed(2)}
              </p>
            </div>
            
            <div className="character-status">
              {character.isGoldEarner && (
                <div className="status-badge gold-earner">
                  <span className="material-icons">monetization_on</span>
                  <span>골드 획득</span>
                </div>
              )}
              <span className="material-icons">chevron_right</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="statistics-section">
        <h3>통계</h3>
        <div className="stats-container">
          <div className="stat-item">
            <p className="stat-label">전체 캐릭터</p>
            <p className="stat-value">{stats.totalCharacters}개</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">표시 중인 캐릭터</p>
            <p className="stat-value">{stats.visibleCharacters}개</p>
          </div>
          <div className="stat-item">
            <p className="stat-label">골드 획득 캐릭터</p>
            <p className="stat-value">{stats.goldEarners}개</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CharacterListPage;
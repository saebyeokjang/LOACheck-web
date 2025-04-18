// src/services/CharacterService.js - 캐릭터 서비스
import { 
  collection, 
  doc,
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy
} from "firebase/firestore";
import { auth, db } from "../firebase";

// 기본 휴식 게이지 최대값 설정
const REST_POINTS = {
  "카오스 던전": 200,
  "가디언 토벌": 200,
  "에포나 의뢰": 100
};

const CharacterService = {
  // 현재 사용자의 모든 캐릭터 가져오기
  fetchCharacters: async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("인증된 사용자가 없습니다");
      
      const charactersRef = collection(db, "users", user.uid, "characters");
      const snapshot = await getDocs(charactersRef);
      
      // 캐릭터 데이터 변환
      const characters = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // 일일 숙제 데이터 정규화
        const dailyTasks = Array.isArray(data.dailyTasks) ? data.dailyTasks.map(task => {
          return {
            ...task,
            type: task.type || "알 수 없음",
            completionCount: task.completionCount || 0,
            restingPoints: task.restingPoints || 0,
            maxRestingPoints: REST_POINTS[task.type] || 100
          };
        }) : [];
        
        return {
          id: doc.id,
          name: data.name || doc.id,
          server: data.server || "",
          characterClass: data.characterClass || "",
          level: data.level || 0,
          isHidden: data.isHidden || false,
          isGoldEarner: data.isGoldEarner || false,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          dailyTasks: dailyTasks,
          raidGates: Array.isArray(data.raidGates) ? data.raidGates : [],
          additionalGoldMap: data.additionalGoldMap || "{}"
        };
      });
      
      // 레벨 기준 내림차순 정렬 및 숨김 캐릭터 필터링
      return characters
        .filter(char => !char.isHidden)
        .sort((a, b) => b.level - a.level);
    } catch (error) {
      console.error("캐릭터 조회 오류:", error);
      return [];
    }
  },
  
  // 특정 캐릭터 상세 정보 가져오기
  fetchCharacterDetails: async (characterName) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("인증된 사용자가 없습니다");
      
      const characterRef = doc(db, "users", user.uid, "characters", characterName);
      const docSnap = await getDoc(characterRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      
      // 일일 숙제 데이터 정규화
      const dailyTasks = Array.isArray(data.dailyTasks) ? data.dailyTasks.map(task => {
        return {
          ...task,
          type: task.type || "알 수 없음",
          completionCount: task.completionCount || 0,
          restingPoints: task.restingPoints || 0,
          maxRestingPoints: REST_POINTS[task.type] || 100
        };
      }) : [];
      
      return {
        id: docSnap.id,
        name: data.name || docSnap.id,
        server: data.server || "",
        characterClass: data.characterClass || "",
        level: data.level || 0,
        isHidden: data.isHidden || false,
        isGoldEarner: data.isGoldEarner || false,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        dailyTasks: dailyTasks,
        raidGates: Array.isArray(data.raidGates) ? data.raidGates : [],
        additionalGoldMap: data.additionalGoldMap || "{}"
      };
    } catch (error) {
      console.error(`캐릭터 '${characterName}' 상세정보 조회 오류:`, error);
      return null;
    }
  },
  
  // API키 유효성 검사 (웹 버전 추가)
  validateApiKey: async (apiKey) => {
    try {
      if (!apiKey) return false;
      
      // 간단한 API 키 유효성 검사 - 실제 로스트아크 API에 요청을 보내볼 수 있음
      const response = await fetch("https://developer-lostark.game.onstove.com/characters/test", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
      
      return response.status === 200;
    } catch (error) {
      console.error("API 키 검증 오류:", error);
      return false;
    }
  },
  
  // API에서 캐릭터 정보 새로고침 (웹 버전 추가)
  refreshCharactersFromAPI: async () => {
    try {
      const apiKey = localStorage.getItem('apiKey');
      if (!apiKey) throw new Error("API 키가 설정되지 않았습니다");
      
      const user = auth.currentUser;
      if (!user) throw new Error("인증된 사용자가 없습니다");
      
      // 실제 구현에서는 로스트아크 API를 호출하여 캐릭터 정보 가져오기
      // 이 예제에서는 단순화를 위해 생략
      
      return true;
    } catch (error) {
      console.error("캐릭터 새로고침 오류:", error);
      throw error;
    }
  },
  
  // 주간 골드 계산
  calculateWeeklyGold: (characters) => {
    let total = 0;
    let earned = 0;
    
    for (const character of characters) {
      if (!character.isGoldEarner) continue;
      
      // 캐릭터별 골드 계산 로직
      // 실제 앱 로직을 웹에서 동일하게 구현
      const raidGates = character.raidGates || [];
      
      // 레이드별로 그룹화
      const raidGroups = {};
      for (const gate of raidGates) {
        if (!raidGroups[gate.raid]) {
          raidGroups[gate.raid] = [];
        }
        raidGroups[gate.raid].push(gate);
      }
      
      // 상위 3개 레이드 (골드 높은 순) - 간소화된 로직
      // 실제 구현에서는 RaidData.js에서 정의한 레이드별 골드 관련 로직을 추가해야 함
      const raidTotals = Object.entries(raidGroups).map(([raid, gates]) => {
        const raidTotal = gates.reduce((sum, gate) => sum + (gate.goldReward || 0), 0);
        return { raid, total: raidTotal };
      });
      
      // 골드 높은 순으로 정렬
      raidTotals.sort((a, b) => b.total - a.total);
      
      // 상위 3개 레이드만 선택
      const topRaids = raidTotals.slice(0, 3).map(item => item.raid);
      
      // 골드 합산
      for (const raid in raidGroups) {
        const gates = raidGroups[raid];
        const isTopRaid = topRaids.includes(raid);
        
        // 기본 골드 보상 (상위 3개 레이드만)
        if (isTopRaid) {
          for (const gate of gates) {
            const goldReward = gate.goldReward || 0;
            if (!gate.isGoldDisabled) {
              total += goldReward;
              if (gate.isCompleted) {
                earned += goldReward;
              }
            }
          }
        }
        
        // 추가 골드 (모든 레이드)
        try {
          let additionalGoldMap = {};
          try {
            additionalGoldMap = JSON.parse(character.additionalGoldMap);
          } catch {
            additionalGoldMap = {};
          }
          
          const additionalGold = additionalGoldMap[raid] || 0;
          
          if (additionalGold > 0) {
            total += additionalGold;
            
            // 하나라도 완료된 관문이 있으면 추가 골드 획득한 것으로 처리
            const hasCompletedGate = gates.some(gate => gate.isCompleted);
            if (hasCompletedGate) {
              earned += additionalGold;
            }
          }
        } catch (error) {
          console.error("추가 골드 파싱 오류:", error);
        }
      }
    }
    
    return { total, earned };
  },
  
  // 모든 데이터 초기화 (웹 버전 추가)
  resetAllData: async () => {
    try {
      // 로컬 스토리지에서 캐릭터 정보 초기화
      localStorage.removeItem('characters');
      
      // Firebase에서도 삭제할 수 있지만, 여기서는 단순화를 위해 생략
      
      return true;
    } catch (error) {
      console.error("데이터 초기화 오류:", error);
      throw error;
    }
  }
};

export default CharacterService;
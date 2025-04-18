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
          return {
            id: doc.id,
            name: data.name,
            server: data.server,
            characterClass: data.characterClass,
            level: data.level,
            isHidden: data.isHidden || false,
            isGoldEarner: data.isGoldEarner || false,
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            dailyTasks: data.dailyTasks || [],
            raidGates: data.raidGates || [],
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
        return {
          id: docSnap.id,
          name: data.name,
          server: data.server,
          characterClass: data.characterClass,
          level: data.level,
          isHidden: data.isHidden || false,
          isGoldEarner: data.isGoldEarner || false,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          dailyTasks: data.dailyTasks || [],
          raidGates: data.raidGates || [],
          additionalGoldMap: data.additionalGoldMap || "{}"
        };
      } catch (error) {
        console.error(`캐릭터 '${characterName}' 상세정보 조회 오류:`, error);
        return null;
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
          const raidTotal = gates.reduce((sum, gate) => sum + gate.goldReward, 0);
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
              if (!gate.isGoldDisabled) {
                total += gate.goldReward;
                if (gate.isCompleted) {
                  earned += gate.goldReward;
                }
              }
            }
          }
          
          // 추가 골드 (모든 레이드)
          try {
            const additionalGoldMap = JSON.parse(character.additionalGoldMap);
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
    }
  };
  
  export default CharacterService;
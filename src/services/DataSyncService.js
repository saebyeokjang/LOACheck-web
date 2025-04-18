// src/services/DataSyncService.js - 데이터 동기화 서비스
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    query, 
    where, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import app from '../firebase';
  
  // Firestore 및 Auth 초기화
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  // 로컬 스토리지 키
  const SYNC_STATUS_KEY = 'loacheck_sync_status';
  const AUTO_SYNC_KEY = 'useAutoSync';
  
  class DataSyncService {
    // 동기화 상태 조회
    async getSyncStatus() {
      try {
        // 로컬 스토리지에서 상태 조회
        const savedStatus = localStorage.getItem(SYNC_STATUS_KEY);
        
        if (savedStatus) {
          return JSON.parse(savedStatus);
        }
        
        // 기본값 반환
        return {
          lastSyncTime: null,
          hasPendingChanges: false,
          lastError: null
        };
      } catch (error) {
        console.error('동기화 상태 조회 오류:', error);
        
        return {
          lastSyncTime: null,
          hasPendingChanges: false,
          lastError: null
        };
      }
    }
    
    // 동기화 수행
    async performSync() {
      try {
        // 현재 로그인 중인 사용자 확인
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('인증이 필요합니다.');
        }
        
        // 로컬 데이터 가져오기 (구현 필요)
        const localData = this.getLocalData();
        
        // 서버 데이터 가져오기
        const serverData = await this.fetchServerData(user.uid);
        
        // 데이터 병합 수행 (로컬과 서버 데이터 비교 및 병합)
        const mergedData = this.mergeData(localData, serverData);
        
        // 병합된 데이터를 서버에 저장
        await this.saveToServer(user.uid, mergedData);
        
        // 병합된 데이터를 로컬에 저장
        this.saveToLocal(mergedData);
        
        // 동기화 상태 업데이트
        const syncStatus = {
          lastSyncTime: new Date().toISOString(),
          hasPendingChanges: false,
          lastError: null
        };
        
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
        
        return true;
      } catch (error) {
        console.error('데이터 동기화 오류:', error);
        
        // 오류 정보 저장
        const syncStatus = await this.getSyncStatus();
        syncStatus.lastError = error.message;
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
        
        throw error;
      }
    }
    
    // 클라우드에서 데이터 가져오기
    async pullFromCloud() {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('인증이 필요합니다.');
        }
        
        // Firestore에서 사용자 데이터 가져오기
        const userData = await this.fetchServerData(user.uid);
        
        // 로컬 스토리지에 저장
        this.saveToLocal(userData);
        
        // 동기화 상태 업데이트
        const syncStatus = {
          lastSyncTime: new Date().toISOString(),
          hasPendingChanges: false,
          lastError: null
        };
        
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
        
        return userData;
      } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        throw error;
      }
    }
    
    // 클라우드로 데이터 업로드
    async pushToCloud() {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('인증이 필요합니다.');
        }
        
        // 로컬 데이터 가져오기
        const localData = this.getLocalData();
        
        // Firestore에 데이터 저장
        await this.saveToServer(user.uid, localData);
        
        // 동기화 상태 업데이트
        const syncStatus = {
          lastSyncTime: new Date().toISOString(),
          hasPendingChanges: false,
          lastError: null
        };
        
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
        
        return true;
      } catch (error) {
        console.error('데이터 업로드 오류:', error);
        throw error;
      }
    }
    
    // 로컬 변경 사항 표시
    markLocalChanges() {
      try {
        const syncStatus = JSON.parse(localStorage.getItem(SYNC_STATUS_KEY)) || {
          lastSyncTime: null,
          hasPendingChanges: false,
          lastError: null
        };
        
        syncStatus.hasPendingChanges = true;
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
        
        // 자동 동기화가 활성화되어 있고 로그인 상태면 동기화 시도
        const isAutoSyncEnabled = localStorage.getItem(AUTO_SYNC_KEY) !== 'false';
        const isLoggedIn = !!auth.currentUser;
        
        if (isAutoSyncEnabled && isLoggedIn && navigator.onLine) {
          // 약간의 지연 후 동기화 실행 (UI 작업이 먼저 완료되도록)
          setTimeout(() => {
            this.performSync().catch(err => {
              console.error('자동 동기화 실패:', err);
            });
          }, 1000);
        }
        
        return true;
      } catch (error) {
        console.error('변경 사항 표시 오류:', error);
        return false;
      }
    }
    
    // 자동 동기화 설정
    setAutoSync(enabled) {
      localStorage.setItem(AUTO_SYNC_KEY, enabled.toString());
      
      // 자동 동기화를 활성화하고 보류 중인 변경 사항이 있으면 즉시 동기화
      if (enabled) {
        this.getSyncStatus().then(status => {
          if (status.hasPendingChanges && auth.currentUser && navigator.onLine) {
            this.performSync().catch(err => {
              console.error('설정 변경 후 자동 동기화 실패:', err);
            });
          }
        });
      }
      
      return true;
    }
    
    // --- 내부 헬퍼 메서드 ---
    
    // 서버에서 사용자 데이터 가져오기
    async fetchServerData(userId) {
      try {
        // 사용자 프로필 정보 가져오기
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          return { profile: {}, characters: [] };
        }
        
        const userProfile = userDoc.data();
        
        // 캐릭터 목록 가져오기
        const charactersRef = collection(db, "users", userId, "characters");
        const charactersSnapshot = await getDocs(charactersRef);
        
        const characters = charactersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return {
          profile: userProfile,
          characters: characters
        };
      } catch (error) {
        console.error("서버 데이터 가져오기 실패:", error);
        throw error;
      }
    }
    
    // 서버에 데이터 저장
    async saveToServer(userId, data) {
      try {
        // 사용자 프로필 정보 저장
        if (data.profile) {
          const userRef = doc(db, "users", userId);
          await setDoc(userRef, {
            ...data.profile,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
        
        // 캐릭터 정보 저장
        if (data.characters && Array.isArray(data.characters)) {
          for (const character of data.characters) {
            if (!character.name) continue; // 이름이 없는 캐릭터는 건너뛰기
            
            const characterRef = doc(db, "users", userId, "characters", character.name);
            await setDoc(characterRef, {
              ...character,
              lastUpdated: serverTimestamp()
            }, { merge: true });
          }
        }
        
        return true;
      } catch (error) {
        console.error("서버 데이터 저장 실패:", error);
        throw error;
      }
    }
    
    // 로컬 스토리지에서 데이터 가져오기
    getLocalData() {
      try {
        // 사용자 프로필
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // 캐릭터 목록
        const characters = JSON.parse(localStorage.getItem('characters') || '[]');
        
        return {
          profile,
          characters
        };
      } catch (error) {
        console.error("로컬 데이터 가져오기 실패:", error);
        return { profile: {}, characters: [] };
      }
    }
    
    // 로컬 스토리지에 데이터 저장
    saveToLocal(data) {
      try {
        // 사용자 프로필 저장
        if (data.profile) {
          localStorage.setItem('userProfile', JSON.stringify(data.profile));
        }
        
        // 캐릭터 목록 저장
        if (data.characters) {
          localStorage.setItem('characters', JSON.stringify(data.characters));
        }
        
        return true;
      } catch (error) {
        console.error("로컬 데이터 저장 실패:", error);
        return false;
      }
    }
    
    // 데이터 병합 (로컬과 서버 데이터 비교 및 병합)
    mergeData(localData, serverData) {
      // 가장 최신 데이터를 사용하는 간단한 병합 구현
      // 실제 구현에서는 더 복잡한 병합 로직이 필요할 수 있음
      
      const mergedProfile = { ...localData.profile, ...serverData.profile };
      
      // 캐릭터 병합 (이름을 기준으로)
      const mergedCharacters = [];
      const allCharacterNames = new Set();
      
      // 모든 캐릭터 이름 수집
      localData.characters.forEach(char => allCharacterNames.add(char.name));
      serverData.characters.forEach(char => allCharacterNames.add(char.name));
      
      // 각 캐릭터에 대해 병합
      allCharacterNames.forEach(name => {
        const localChar = localData.characters.find(c => c.name === name) || {};
        const serverChar = serverData.characters.find(c => c.name === name) || {};
        
        // 서버 데이터가 더 최신인지 확인
        const isServerNewer = serverChar.lastUpdated && (!localChar.lastUpdated || 
          new Date(serverChar.lastUpdated) > new Date(localChar.lastUpdated));
        
        // 최신 데이터 선택
        const mergedChar = isServerNewer ? { ...localChar, ...serverChar } : { ...serverChar, ...localChar };
        
        if (Object.keys(mergedChar).length > 1) { // 빈 객체가 아니면 추가
          mergedCharacters.push(mergedChar);
        }
      });
      
      return {
        profile: mergedProfile,
        characters: mergedCharacters
      };
    }
  }
  
  export default new DataSyncService();
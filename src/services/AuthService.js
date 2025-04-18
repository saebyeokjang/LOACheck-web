// src/services/AuthService.js - 인증 서비스
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

console.log("Firebase 인증 객체:", auth);
console.log("Firebase 설정 확인:", {
  apiKey: auth.app.options.apiKey,
  authDomain: auth.app.options.authDomain,
  projectId: auth.app.options.projectId
});

// 인증 서비스 객체
const AuthService = {
  // 현재 사용자 가져오기
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // 인증 상태 변경 구독
  subscribeToAuthChanges: (callback) => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        // 사용자 프로필 정보 저장
        const userRef = doc(db, "users", user.uid);
        setDoc(userRef, {
          displayName: user.displayName || "사용자",
          email: user.email || "",
          lastActive: serverTimestamp()
        }, { merge: true });
      }
      // 콜백 호출
      callback(user);
    });
  },

  // Google로 로그인
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // 사용자 정보 Firestore에 저장
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(userRef, {
        displayName: result.user.displayName || "사용자",
        email: result.user.email || "",
        lastActive: serverTimestamp()
      }, { merge: true });

      return { success: true, user: result.user };
    } catch (error) {
      console.error("Google 로그인 오류:", error);
      return { success: false, error };
    }
  },

  // Apple로 로그인
  signInWithApple: async () => {
    try {
      console.log("Apple 로그인 시작...");

      // Apple 로그인 제공자 객체 생성
      const provider = new OAuthProvider('apple.com');

      // 필요한 범위 추가
      provider.addScope('email');
      provider.addScope('name');

      // 디버깅: provider 객체 정보 출력
      console.log("Apple provider 생성됨:", {
        providerId: provider.providerId,
        scopes: Array.from(provider.scopes || []),
        customParameters: provider.customParameters || {}
      });

      // 팝업으로 로그인 시도
      console.log("팝업으로 로그인 시도 중...");
      const result = await signInWithPopup(auth, provider);
      console.log("로그인 성공 결과:", result);

      // 사용자 정보 Firestore에 저장
      if (result.user) {
        console.log("Firestore에 사용자 정보 저장 중...");
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          displayName: result.user.displayName || "사용자",
          email: result.user.email || "",
          lastActive: serverTimestamp()
        }, { merge: true });
        console.log("사용자 정보 저장 완료");

        return { success: true, user: result.user };
      } else {
        console.error("Apple 로그인: 사용자 정보 없음");
        return { success: false, error: new Error("사용자 정보를 가져올 수 없습니다") };
      }
    } catch (error) {
      // 오류 상세 정보 기록
      console.error("Apple 로그인 오류:", error);
      console.error("상세 오류 정보:", {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack,
        credential: error.credential ? {
          providerId: error.credential.providerId,
          signInMethod: error.credential.signInMethod
        } : 'credential 없음'
      });

      // Firebase 인증 설정 확인
      console.log("Firebase 인증 설정:", {
        apiKey: auth.app.options.apiKey,
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      });

      // 에러 반환
      return { success: false, error };
    }
  },

  // 로그아웃
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("로그아웃 오류:", error);
      return { success: false, error };
    }
  },

  // 대표 캐릭터 설정
  setRepresentativeCharacter: async (characterName) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("인증된 사용자가 없습니다");

      // 전역 설정에 저장
      localStorage.setItem("representativeCharacter", characterName);
      // 사용자별 설정에 저장
      localStorage.setItem(`representativeCharacter_${user.uid}`, characterName);

      // Firestore에 저장
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: characterName || user.displayName || "사용자"
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error("대표 캐릭터 설정 오류:", error);
      return { success: false, error };
    }
  },

  // 대표 캐릭터 가져오기
  getRepresentativeCharacter: () => {
    const user = auth.currentUser;
    if (!user) return "";

    // 사용자별 설정 우선
    const userRepChar = localStorage.getItem(`representativeCharacter_${user.uid}`);
    if (userRepChar) return userRepChar;

    // 전역 설정 차선
    return localStorage.getItem("representativeCharacter") || "";
  }
};

export default AuthService;
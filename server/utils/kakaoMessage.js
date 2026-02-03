import User from '../models/User.js';
import KakaoMessageLog from '../models/KakaoMessageLog.js';

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || 'https://rg-manager.onrender.com';

/**
 * 카카오 액세스 토큰 갱신
 */
async function refreshKakaoToken(userId, refreshToken) {
  try {
    const tokenParams = {
      grant_type: 'refresh_token',
      client_id: KAKAO_CLIENT_ID,
      refresh_token: refreshToken,
    };

    if (KAKAO_CLIENT_SECRET) {
      tokenParams.client_secret = KAKAO_CLIENT_SECRET;
    }

    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams(tokenParams),
    });

    const data = await response.json();

    if (data.error) {
      console.error('카카오 토큰 갱신 실패:', data);
      return null;
    }

    const newAccessToken = data.access_token;
    // refresh_token은 만료 임박 시에만 반환됨
    const newRefreshToken = data.refresh_token || refreshToken;
    const expiresIn = data.expires_in;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // DB에 새 토큰 저장
    await User.updateKakaoTokens(userId, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenExpiresAt,
    });

    console.log('카카오 토큰 갱신 완료');
    return newAccessToken;
  } catch (error) {
    console.error('카카오 토큰 갱신 오류:', error);
    return null;
  }
}

/**
 * 유효한 액세스 토큰 가져오기 (필요시 갱신)
 */
async function getValidAccessToken(userId, checkConsent = true) {
  const tokens = await User.getKakaoTokens(userId);

  if (!tokens || !tokens.kakaoAccessToken) {
    console.log('카카오 토큰 없음');
    return null;
  }

  if (checkConsent && !tokens.kakaoMessageConsent) {
    console.log('메시지 알림 미동의');
    return null;
  }

  // 토큰 만료 확인 (5분 버퍼)
  const expiresAt = new Date(tokens.kakaoTokenExpiresAt);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5분

  if (expiresAt.getTime() - now.getTime() < bufferMs) {
    // 토큰 만료 임박, 갱신 시도
    console.log('카카오 토큰 만료 임박, 갱신 시도...');
    return await refreshKakaoToken(userId, tokens.kakaoRefreshToken);
  }

  return tokens.kakaoAccessToken;
}

/**
 * 요일 가져오기
 */
function getDayOfWeek(dateString) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateString);
  return days[date.getDay()];
}

/**
 * 카카오톡 출석 알림 메시지 전송
 */
export async function sendAttendanceKakaoMessage({
  userId,
  date,
  className,
  schedule,
  students,
  presentStudentIds,
}) {
  try {
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return {
        success: false,
        error: '유효한 카카오 토큰이 없거나 메시지 알림에 동의하지 않았습니다.',
        skipped: true,
      };
    }

    const dayOfWeek = getDayOfWeek(date);
    const presentCount = presentStudentIds.length;
    const totalCount = students.length;
    const presentStudentNames = students
      .filter((s) => presentStudentIds.includes(s.id))
      .map((s) => s.name)
      .join(', ');

    // Text 템플릿 사용 (List 템플릿보다 간단하고 안정적)
    const templateObject = {
      object_type: 'text',
      text: `📋 출석 체크 완료\n\n📅 ${date} (${dayOfWeek})\n📚 ${className}\n⏰ ${schedule}\n\n✅ 출석: ${presentCount}명 / ${totalCount}명\n👥 ${presentStudentNames || '없음'}`,
      link: {
        web_url: APP_URL,
        mobile_web_url: APP_URL,
      },
      button_title: '출석 관리 열기',
    };

    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify(templateObject),
      }),
    });

    const result = await response.json();

    const messageContent = templateObject.text;

    if (result.result_code === 0) {
      console.log('카카오톡 메시지 전송 성공');
      // 로그 기록
      await KakaoMessageLog.create({
        senderId: userId,
        recipientId: userId,
        messageType: 'ATTENDANCE',
        messageContent,
        success: true,
        errorMessage: null,
      });
      return { success: true };
    } else {
      console.error('카카오톡 메시지 전송 실패:', result);
      // 실패 로그 기록
      await KakaoMessageLog.create({
        senderId: userId,
        recipientId: userId,
        messageType: 'ATTENDANCE',
        messageContent,
        success: false,
        errorMessage: result.msg || '메시지 전송 실패',
      });
      return { success: false, error: result.msg || '메시지 전송 실패' };
    }
  } catch (error) {
    console.error('카카오톡 메시지 전송 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 관리자가 특정 사용자에게 커스텀 메시지 전송
 */
export async function sendCustomKakaoMessage({
  senderId,
  recipientId,
  message,
}) {
  try {
    // 수신자의 토큰으로 메시지 전송 (나에게 보내기 API 사용)
    const accessToken = await getValidAccessToken(recipientId, false);

    if (!accessToken) {
      return {
        success: false,
        error: '수신자의 카카오 토큰이 없습니다. 수신자가 카카오로 다시 로그인해야 합니다.',
      };
    }

    const templateObject = {
      object_type: 'text',
      text: message,
      link: {
        web_url: APP_URL,
        mobile_web_url: APP_URL,
      },
      button_title: '출석 관리 열기',
    };

    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        template_object: JSON.stringify(templateObject),
      }),
    });

    const result = await response.json();

    if (result.result_code === 0) {
      console.log('카카오톡 커스텀 메시지 전송 성공');
      // 로그 기록
      await KakaoMessageLog.create({
        senderId,
        recipientId,
        messageType: 'CUSTOM',
        messageContent: message,
        success: true,
        errorMessage: null,
      });
      return { success: true };
    } else {
      console.error('카카오톡 커스텀 메시지 전송 실패:', result);
      // 실패 로그 기록
      await KakaoMessageLog.create({
        senderId,
        recipientId,
        messageType: 'CUSTOM',
        messageContent: message,
        success: false,
        errorMessage: result.msg || '메시지 전송 실패',
      });
      return { success: false, error: result.msg || '메시지 전송 실패' };
    }
  } catch (error) {
    console.error('카카오톡 커스텀 메시지 전송 오류:', error);
    return { success: false, error: error.message };
  }
}

export default { sendAttendanceKakaoMessage, sendCustomKakaoMessage };

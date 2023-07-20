const crypto = require('crypto');

/**
 * 문자열을 SHA-256으로 해싱하는 함수
 * @param input 
 * @returns hashHex(해싱값)
 */
const getSha256Hash = async (input) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 현재 시간의 Unix 타임스탬프를 가져오는 함수
 * @returns 초(s) 단위 정수
 */
const getCurrentUnixTimestamp = () => {
    return Math.floor(Date.now() / 1000); // 밀리초(ms)를 초(s)로 변환
}

/**
 * 현재 시간 기준 1시간 후의 Unix 타임스탬프를 가져오는 함수
 * @returns Unix 타임스탬프 
 */
const getUnixTimestampAfterOneHour = (second) => {
    const currentTimestamp = getCurrentUnixTimestamp();
    const oneHourInSeconds = second;
    return currentTimestamp + oneHourInSeconds;
  }

module.exports = 
{
    getSha256Hash,
    getCurrentUnixTimestamp,
    getUnixTimestampAfterOneHour
};
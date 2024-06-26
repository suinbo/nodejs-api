const SUCCESS_CODE = '0000',
    SESSION_EXPIRED_CODE = '1000',
    NOT_EXISTED_CODE = '1100',
    ERROR_CODE = '1111';

const RESPONSE = {
    SUCCESS: {
        code: SUCCESS_CODE,
        detailMessage: '정상 처리되었습니다.',
    },
    SERVER_ERROR: {
        code: ERROR_CODE,
        detailMessage: '서버 오류가 발생했습니다.',
    },
    SESSION_EXPIRED: {
        code: SESSION_EXPIRED_CODE,
        detailMessage: '세션이 만료되었습니다.',
    },
    UNAUTHENTICATED: {
        code: NOT_EXISTED_CODE,
        detailMessage: '존재하지 않는 계정입니다.',
    },
    UNCORRECT: {
        code: NOT_EXISTED_CODE,
        detailMessage: '비밀번호가 일치하지 않습니다.',
    },
    LOGIN_SUCCESS: {
        code: SUCCESS_CODE,
        detailMessage: '로그인에 성공했습니다.',
    },
    LOGOUT_SUCCESS: {
        code: SUCCESS_CODE,
        detailMessage: '로그아웃 되었습니다.',
    },
    LOGOUT_FAIL: {
        code: ERROR_CODE,
        detailMessage: '로그아웃에 실패하였습니다.',
    },
};

module.exports = {
    RESPONSE,
};

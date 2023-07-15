const express = require('express');
const cors = require('cors');

// body-parser 미들웨어 사용: PUT 요청 본문을 파싱 (req.body)
const bodyParser = require('body-parser');
//app.use(express.json());

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// CORS 허용 설정
app.use(cors());

// '/admins' 경로로 들어오는 요청에 대해서만 router 동작
const adminRouter = require('./adminRouter');
app.use(`/admins`, adminRouter);

// 라우터 정의
router.get('/', function (req, res, next) {
    res.send('Hello from Express'); // 템플릿 엔진 대신 send 사용
});

router.get('/api/get/nodejs-api', function (req, res) {
    res.status(200).json({
        message: 'hello get api nodejs-api',
    });
});

// 1depth 메뉴 조회
router.get('/api/menus/top', function (req, res) {
    res.status(200).json({
        headers: {},
        data: [
            {
                id: 'site',
                menuNm: '사이트',
                menuId: 'site',
                viewYn: true,
                depth: 1,
                leafs: [
                    {
                        id: 'ST110',
                        parentId: 'ST100',
                        menuNm: 'FAQ 목록',
                        menuId: 'faqList',
                        uxId: 'ST00110',
                        url: '/site/faq/faqlist',
                        viewYn: true,
                        depth: 2,
                        leafs: [],
                    },
                    {
                        id: 'ST120',
                        parentId: 'ST100',
                        menuNm: '자주 찾는 질문 관리',
                        menuId: 'faqMgmt',
                        uxId: 'ST00120',
                        url: '/site/faq/faqMgmt',
                        viewYn: true,
                        depth: 2,
                        leafs: [],
                    },
                ],
            },
            {
                id: 'operation',
                menuNm: '편성/운영',
                menuId: 'operation',
                viewYn: true,
                depth: 1,
                leafs: [
                    {
                        id: 'OP100',
                        parentId: 'operation',
                        menuNm: '큐레이션',
                        menuId: 'curation',
                        url: '/operation/curation',
                        viewYn: true,
                        depth: 1,
                        leafs: [],
                    },
                ],
            },
        ],
        code: '0000',
        detailMessage: 'login success.',
    });
});

// 2depth 메뉴 조회
router.get('/api/menus/side/site/list', function (req, res) {
    res.status(200).json({
        headers: {},
        data: [
            {
                id: 'ST100',
                parentId: 'site',
                menuNm: 'FAQ',
                menuId: 'faq',
                viewYn: false,
                depth: 1,
                leafs: [
                    {
                        id: 'ST110',
                        parentId: 'ST100',
                        menuNm: 'FAQ 목록',
                        menuId: 'faqList',
                        uxId: 'ST00110',
                        url: '/site/faq/faqlist',
                        viewYn: true,
                        depth: 2,
                        leafs: [],
                    },
                    {
                        id: 'ST120',
                        parentId: 'ST100',
                        menuNm: '자주 찾는 질문 관리',
                        menuId: 'faqMgmt',
                        uxId: 'ST00120',
                        url: '/site/faq/faqMgmt',
                        viewYn: true,
                        depth: 2,
                        leafs: [],
                    },
                ],
            },
            {
                id: 'ST200',
                parentId: 'site',
                menuNm: '공지사항',
                menuId: 'notice',
                viewYn: true,
                depth: 1,
                leafs: [],
            },
        ],
        code: '0000',
        detailMessage: 'login success.',
    });
});

router.get('/api/menus/side/operation/list', function (req, res) {
    res.status(200).json({
        headers: {},
        data: [
            {
                id: 'OP100',
                parentId: 'operation',
                menuNm: '큐레이션',
                menuId: 'curation',
                url: '/operation/curation',
                viewYn: true,
                depth: 1,
                leafs: [],
            },
        ],
        code: '0000',
        detailMessage: 'login success.',
    });
});

// 로그인
router.post('/api/post/login', function (req, res) {
    const { accessId, secretPw } = req.body;
    if (accessId == 'admin' && secretPw == '1234') {
        res.status(200).json({
            headers: {},
            data: {
                accessToken: 'admin',
                expireTime: 1688207263,
                languageCode: 'ko',
                loginId: 'admin',
                loginIp: '',
                loginStatus: 'S1',
                loginTime: 1688207263,
                regionList: [{ id: 'KR' }, { id: 'JP' }],
                timeZoneData: 1688207263,
            },
            code: '0000',
            detailMessage: 'login success.',
        });
    } else {
        res.status(200).json({
            message: 'login fail.',
        });
    }
});

// 유저 로그인 기록 조회
router.get('/api/users/infoHistory', function (req, res) {
    res.status(200).json({
        headers: {},
        data: {
            list: [
                {
                    no: 1,
                    historyDesc: '로그인',
                    historyDate: 1688207263,
                    ip: '192.168.200.1',
                },
                {
                    no: 2,
                    historyDesc: '로그아웃',
                    historyDate: 1688207263,
                    ip: '192.168.200.1',
                },
            ],
            totalCount: 2,
        },
        code: '0000',
        detailMessage: 'login success.',
    });
});

// 유저 정보 조회
router.get('/api/users/info', function (req, res) {
    res.status(200).json({
        headers: {},
        data: {
            id: 'admin',
            name: '관리자',
            phone: '010-2958-8046',
            email: 'suin9610@gmail.com',
            department: '개발팀',
            langCode: 'KR',
            timeCode: 'Seoul',
        },
        code: '0000',
        detailMessage: 'login success.',
    });
});

// 세계 타임존 옵션 조회
router.get('/api/timezones', function (req, res) {
    res.status(200).json({
        headers: {},
        data: [
            {
                timeCode: 'Anchorage',
                timeDefault: true,
                timeName: '(UTC-09:00) Alaska',
                timeValue: '',
            },
            {
                timeCode: 'Godthab',
                timeDefault: true,
                timeName: '(UTC-03:00) Greenland',
                timeValue: '',
            },
            {
                timeCode: 'Buenos_Aires',
                timeDefault: true,
                timeName: '(UTC-03:00) Buenos Aires',
                timeValue: '',
            },
            {
                timeCode: 'GMT',
                timeDefault: true,
                timeName: '(UTC+00:00) Coordinated Universal Time',
                timeValue: '',
            },
            {
                timeCode: 'Seoul',
                timeDefault: true,
                timeName: '(UTC+09:00) Seoul',
                timeValue: '',
            },
        ],
        code: '0000',
        detailMessage: 'login success.',
    });
});

// 사용 언어 조회
router.get('/api/languages', function (req, res) {
    res.status(200).json({
        headers: {},
        data: [
            {
                code: 'KR',
                name: '한국어',
            },
            {
                code: 'ENG',
                name: '영어',
            },
            {
                code: 'JR',
                name: '일본어',
            },
        ],
        code: '0000',
        detailMessage: 'login success.',
    });
});

// 라우터 등록
app.use('/', router);

module.exports = app;

const express = require('express');
const cors = require('cors');
const app = express();
const router = express.Router();

// CORS 허용 설정
app.use(cors());

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
            },
            {
                id: 'operation',
                menuNm: '편성/운영',
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

// 라우터 등록
app.use('/', router);

module.exports = app;

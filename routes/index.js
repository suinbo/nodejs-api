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

// 라우터 등록
app.use('/', router);

module.exports = app;

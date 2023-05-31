const express = require('express');
const cors = require('cors');
const app = express();
const router = express.Router();

// CORS 허용 설정
app.use(cors());

// 라우터 정의
router.get('/', function(req, res, next) {
  res.send('Hello from Express'); // 템플릿 엔진 대신 send 사용
});

router.get('/api/get/nodejs-api', function(req, res) {
  res.status(200).json({
    "message": "hello get api nodejs-api"
  });
});

router.post('/api/post/nodejs-api', function(req, res) {
  res.status(200).json({
    "message": "hello post api nodejs-api"
  });
});

// 라우터 등록
app.use('/', router);

module.exports = app
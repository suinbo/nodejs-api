const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const express = require('express');
const mysql = require('mysql2');

const connection = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'office',
};

//const cookieParser = require('cookie-parser');
//app.use(cookieParser());

const app = express();

// 세션 미들웨어 설정
app.use(
    session({
        secret: 'secret_key',
        resave: false, // 변경되지 않은 세션 데이터 DB 저장 여부
        saveUninitialized: false, // 초기화되지 않은 새로운 세션 DB 저장 여부
        store: new MySQLStore(connection),
        cookie: {
            httpOnly: true, // 클라이언트 스크립트에서 쿠키에 접근하지 못하도록 설정
            maxAge: 3600000, // 1시간 동안 유효한 쿠키
        },
    })
);

// body-parser 미들웨어 사용: PUT 요청 본문을 파싱 (req.body)
// const bodyParser = require('body-parser');
app.use(express.json());

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// CORS 허용 설정 (서버가 다른 도메인 또는 포트에서 온 요청을 허용)
const cors = require('cors');
app.use(cors());

// '/admins' 경로로 들어오는 요청에 대해서만 router 동작
const adminRouter = require('./adminRouter');
app.use(`/admins`, adminRouter);

module.exports = app;

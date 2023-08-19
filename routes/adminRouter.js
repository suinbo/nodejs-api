const express = require('express');
const router = express.Router();
const adminDBC = require('../adminDB');
const { getSha256Hash, getUnixTimestampAfterOneHour, getCurrentUnixTimestamp } = require('../utils');
const { RESPONSE } = require('../constant');

const authenticationMiddleware = async (req, res, next) => {
    const { authorization, adminid } = req.headers;

    // 세션 ID를 헤더로부터 추출
    const sessionId = authorization.split(' ')[1];
    const sessionAdminId = await adminDBC.findSessionIdByAdminId(sessionId);

    // 세션에 사용자 정보가 있는지 확인 (세션 ID 가 존재하고 해당 세션의 사용자가 일치)
    if (sessionId && adminid == sessionAdminId) {
        // 다음 미들웨어나 라우트 핸들러로 진행
        next();
    } else {
        // 세션에 사용자 정보가 없으면 인증 실패
        res.status(200).json(RESPONSE.UNAUTHENTICATED);
    }
};

//로그인
router.post('/login', async (req, res) => {
    const { secretPw } = req.body;

    try {
        const sessionId = req.sessionID;
        const sha256HashPw = await getSha256Hash(secretPw);
        const adminInfo = await adminDBC.postLogin({
            ...req.body,
            secretPw: sha256HashPw,
        });

        const regionList = await adminDBC.getRegions();

        if (!!adminInfo.length) {
            const { id, ip, langCode } = adminInfo[0];
            const expireTime = getUnixTimestampAfterOneHour(60 * 60);

            await adminDBC.putAccessHistory({
                historyDesc: '로그인',
                historyDate: Math.floor(Date.now() / 1000),
                ip,
                id,
            });

            // 세션 데이터를 메모리 상에 저장
            req.session.isLoggedIn = true;
            req.session.adminId = id;
            req.session.save(() => {
                const responseData = {
                    ...RESPONSE.LOGIN_SUCCESS,
                    data: {
                        accessToken: sessionId,
                        expireTime,
                        languageCode: langCode,
                        regionCode: 'KR',
                        loginId: id,
                        loginIp: ip,
                        loginStatus: 'S1',
                        loginTime: getCurrentUnixTimestamp(),
                        regionList: regionList.map((region) => ({ id: region.regionCd })),
                    },
                };

                return res.status(200).json(responseData);
            });
        } else {
            //로그인 정보 없을 시
            return res.status(200).json(RESPONSE.UNAUTHENTICATED);
        }
    } catch (error) {
        console.log('error:: ', error);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//로그아웃
router.post('/logout', async (req, res) => {
    const { loginId, loginIp } = req.body;
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json(RESPONSE.LOGOUT_FAIL);
        } else {
            adminDBC.putAccessHistory({
                historyDesc: '로그아웃',
                historyDate: Math.floor(Date.now() / 1000),
                ip: loginIp,
                id: loginId,
            });
        }

        return res.status(200).json(RESPONSE.LOGOUT_SUCCESS);
    });
});

//언어 목록 조회
router.get('/getLanguages', authenticationMiddleware, async (req, res) => {
    try {
        const row = await adminDBC.getLanguages();
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: row,
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//타임존 목록 조회
router.get('/getTimezones', authenticationMiddleware, async (req, res) => {
    try {
        const row = await adminDBC.getTimezones();
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: row,
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 관리자 정보 조회
router.get('/admins', authenticationMiddleware, async (req, res) => {
    const adminId = req.headers.adminid;

    try {
        const row = await adminDBC.getAdmins(adminId);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: row[0],
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 관리자 정보 수정
router.put('/admins', authenticationMiddleware, async (req, res) => {
    const adminId = req.headers.adminid;

    try {
        await adminDBC.putAdmins(adminId, req.body);
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//비밀번호 변경
router.put('/setPassword', authenticationMiddleware, async (req, res) => {
    const adminId = req.headers.adminid;
    const { secretPw, newSecretPw } = req.body;

    try {
        const password = await adminDBC.getPassword(adminId);
        const hashPassword = await getSha256Hash(secretPw);
        const hashNesPassword = await getSha256Hash(newSecretPw);

        if (password !== hashPassword) {
            return res.status(401).json(RESPONSE.UNCORRECT);
        } else {
            adminDBC.putPassword(adminId, hashNesPassword);
            return res.status(200).json(RESPONSE.SUCCESS);
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//접속 내역 조회
router.get('/getHistories', authenticationMiddleware, async (req, res) => {
    const adminId = req.headers.adminid;
    const pageNo = req.query.page;

    try {
        const { totalCount, row } = await adminDBC.getAccessHistory(adminId, pageNo);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: {
                ...totalCount[0],
                list: row.map((item) => ({
                    no: item.noId,
                    historyDesc: item.historyDesc,
                    historyDate: item.historyDate,
                    ip: item.ip,
                })),
            },
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// depth 별 메뉴 조회
router.get('/getTopMenus', authenticationMiddleware, async (req, res) => {
    try {
        const row = await adminDBC.getTopMenus();
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: row,
        };
        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 1 depth 별 2 depth 메뉴 조회
router.post('/getSideMenus', authenticationMiddleware, async (req, res) => {
    const parentId = req.body.parentId;

    try {
        const row = await adminDBC.getSideMenus(parentId);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: row,
        };
        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 트리 메뉴 조회
router.get('/getTreeMenus', authenticationMiddleware, async (req, res) => {
    try {
        const row = await adminDBC.getTreeMenus();
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: row,
        };
        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 메뉴 상세 조회
router.get('/menuDetails', authenticationMiddleware, async (req, res) => {
    try {
        // 메뉴 1개 당 region 별 언어 매핑
        const row = await adminDBC.getMenuDetails(req.query.menuId);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: {
                id: row[0].menuId,
                menuNm: row[0].menuNm,
                orderNo: row[0].orderNo,
                viewYn: row[0].viewYn,
                desc: row[0].desc,
                langList: row.map((region) => ({
                    regionCd: region.regionCd,
                    regionNm: region.regionNm,
                    languageNm: region.menuNm,
                })),
            },
        };
        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 메뉴 상세 수정
router.put('/menuDetails/:menuId', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.putMenuDetails(req.params.menuId, req.body);
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 메뉴 추가
router.post('/menuDetails', authenticationMiddleware, async (req, res) => {
    try {
        const result = await adminDBC.postMenuDetails(req.body);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: result,
        };
        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 메뉴 삭제
router.delete('/menuDetails/:menuId', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.deleteMenuDetails(req.params.menuId);
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 리전 목록 조회
router.get('/getRegions', authenticationMiddleware, async (req, res) => {
    try {
        const row = await adminDBC.getRegions();
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: row,
        };
        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 시스템 코드 목록 조회
router.get('/getSystemCode', authenticationMiddleware, async (req, res) => {
    try {
        const row = await adminDBC.getSystemCode(req.query.uxId);

        //depth 만들기
        const buildMenuTree = (codeData) => {
            const codeMap = {};
            const rootCode = [];

            for (const code of codeData) {
                code.leafs = [];
                codeMap[code.value] = code;
            }

            // 메뉴 트리 생성
            for (const code of codeData) {
                const data = {
                    id: code.id,
                    name: code.name,
                    value: code.value,
                    depth: code.depth,
                    leafs: code.leafs ?? [],
                };

                const categoryId = code.category;
                if (categoryId) {
                    const parentCode = codeMap[categoryId];
                    parentCode.leafs.push(data);
                } else {
                    rootCode.push(data);
                }
            }

            return rootCode;
        };

        const responseData = {
            ...RESPONSE.SUCCESS,
            data: buildMenuTree(row),
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

// 컨텐츠 목록 조회
router.get('/getContents', authenticationMiddleware, async (req, res) => {
    try {
        const { totalCount, row } = await adminDBC.getContents(req.query);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: {
                ...totalCount[0],
                list: row,
            },
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//FAQ 목록 조회
router.post('/getFAQs', authenticationMiddleware, async (req, res) => {
    try {
        const { totalCount, row } = await adminDBC.getFAQs(req.body);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: {
                ...totalCount[0],
                list: row,
            },
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//FAQ 상세 조회
router.get('/faqDetails', authenticationMiddleware, async (req, res) => {
    try {
        const row = await adminDBC.getFAQDetails(req.query.noId);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: { ...row, poc: row.poc.split(',') },
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//FAQ 상세 수정
router.put('/faqDetails/:noId', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.putFAQDetails({
            ...req.body,
            noId: req.params.noId,
            updateId: req.headers.adminid,
        });
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//FAQ 등록
router.post('/faqDetails', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.postFAQDetails({
            ...req.body,
            updateId: req.headers.adminid,
        });
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//FAQ 개별 삭제
router.delete('/faqDetails/:noId', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.deleteFAQs(req.params.noId);
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//POC별 FAQ 목록 조회
router.get('/getTopFAQs', authenticationMiddleware, async (req, res) => {
    try {
        const { totalCount, row } = await adminDBC.getTopFAQs(req.query.type);
        const responseData = {
            ...RESPONSE.SUCCESS,
            data: {
                ...totalCount[0],
                list: row,
            },
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//POC 별 FAQ(자주찾는질문) 추가
router.put('/topFAQsDetails/:poc', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.putTopFAQs(req.body);
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//POC 별 FAQ 순서 변경
router.post('/topFAQsDetails/order', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.putTopFAQsOrder(req.body);
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

//POC 별 FAQ 삭제
router.put('/topFAQsDetails', authenticationMiddleware, async (req, res) => {
    try {
        await adminDBC.deleteTopFAQs(req.body);
        return res.status(200).json(RESPONSE.SUCCESS);
    } catch (error) {
        console.log(error.message);
        return res.status(500).json(RESPONSE.SERVER_ERROR);
    }
});

module.exports = router;

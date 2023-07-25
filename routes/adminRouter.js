const express = require('express');
const router = express.Router();
const adminDBC = require('../adminDB');
const { getSha256Hash, getUnixTimestampAfterOneHour, getCurrentUnixTimestamp } = require('../utils');

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
        res.status(401).json({ code: '1111', detailMessage: '존재하지 않는 계정입니다.' });
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

            // 세션 데이터를 메모리 상에 저장
            req.session.isLoggedIn = true;
            req.session.adminId = id;
            req.session.save(() => {
                // 세션 ID를 쿠키로 설정하여 클라이언트에  전송
                // res.cookie('connect.sid', req.sessionID, {
                //     httpOnly: true,
                //     maxAge: 3600000, // 1시간 동안 유효한 쿠키
                // });

                const responseData = {
                    code: '0000',
                    data: {
                        accessToken: sessionId,
                        expireTime,
                        languageCode: langCode,
                        loginId: id,
                        loginIp: ip,
                        loginStatus: 'S1',
                        loginTime: getCurrentUnixTimestamp(),
                        regionList: regionList.map((region) => ({ id: region.regionCd })),
                    },
                    detailMessage: 'login success.',
                };

                return res.status(200).json(responseData);
            });
        } else {
            //로그인 정보 없을 시
            const responseData = {
                code: '1000',
                detailMessage: '존재하지 않는 계정입니다.',
            };
            return res.status(200).json(responseData);
        }
    } catch (error) {
        console.log('error:: ', error);

        // 서버 오류 시 응답
        const responseData = {
            code: '5000',
            detailMessage: '서버 오류 발생.',
        };

        return res.status(500).json(responseData);
    }
});

//로그아웃
router.post('/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ code: '1111', detailMessage: '로그아웃 처리 중 오류가 발생했습니다.' });
        }

        // 클라이언트에게 로그아웃 상태를 알림
        return res.json({ code: '0000', detailMessage: '로그아웃 되었습니다.' });
    });
});

//언어 목록 조회
router.get('/getLanguages', authenticationMiddleware, async (req, res) => {
    let res_get_languages = {
        status_code: 500,
        data: {},
    };

    try {
        const row = await adminDBC.getLanguages();
        res_get_languages.status_code = 200;
        res_get_languages.data = row;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_languages.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//타임존 목록 조회
router.get('/getTimezones', authenticationMiddleware, async (req, res) => {
    let res_get_timezones = {
        status_code: 500,
        data: {},
    };

    try {
        const row = await adminDBC.getTimezones();
        res_get_timezones.status_code = 200;
        res_get_timezones.data = row;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_timezones.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 관리자 정보 조회
router.get('/getAdmins', authenticationMiddleware, async (req, res) => {
    const adminId = req.headers.adminid;
    let res_get_admins = {
        status_code: 500,
        admins: {},
    };

    try {
        const row = await adminDBC.getAdmins(adminId);
        res_get_admins.status_code = 200;
        {
            res_get_admins.admins = row[0];
        }
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_admins.admins,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//접속 내역 조회
router.get('/getHistories', authenticationMiddleware, async (req, res) => {
    const adminId = req.headers.adminid;
    let res_get_histories = {
        status_code: 500,
        data: {},
    };

    try {
        const row = await adminDBC.getAccessHistory(adminId);
        res_get_histories.status_code = 200;
        res_get_histories.data = {
            totalCount: row.length,
            list: row.map((item) => ({
                no: item.noId,
                historyDesc: item.historyDesc,
                historyDate: item.historyDate,
                ip: item.ip,
            })),
        };
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_histories.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// depth 별 메뉴 조회
router.get('/getTopMenus', authenticationMiddleware, async (req, res) => {
    let res_get_menus = {
        status_code: 500,
        menus: {},
    };

    try {
        const row = await adminDBC.getTopMenus();
        res_get_menus.status_code = 200;
        res_get_menus.menus = row;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_menus.menus,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 1 depth 별 2 depth 메뉴 조회
router.post('/getSideMenus', authenticationMiddleware, async (req, res) => {
    const parentId = req.body.parentId;
    let res_get_menus = {
        status_code: 500,
        menus: {},
    };

    try {
        const row = await adminDBC.getSideMenus(parentId);
        res_get_menus.status_code = 200;
        res_get_menus.menus = row;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_menus.menus,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 트리 메뉴 조회
router.get('/getTreeMenus', authenticationMiddleware, async (req, res) => {
    let res_get_menus = {
        status_code: 500,
        menus: {},
    };

    try {
        const row = await adminDBC.getTreeMenus();
        res_get_menus.status_code = 200;
        res_get_menus.menus = row;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_menus.menus,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 메뉴 상세 조회
router.get('/getMenuDetails', authenticationMiddleware, async (req, res) => {
    let res_get_details = {
        status_code: 500,
        data: {},
    };

    try {
        // 메뉴 1개 당 region 별 언어 매핑
        const row = await adminDBC.getMenuDetails(req.query.menuId);
        res_get_details.status_code = 200;
        res_get_details.data = {
            id: row[0].menuId,
            menuNm: row[0].menuNm,
            orderNo: row[0].orderNo,
            langList: row.map((region) => ({
                regionCd: region.regionCd,
                regionNm: region.regionNm,
                languageNm: region.mlNm,
            })),
        };
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_details.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 리전 목록 조회
router.get('/getRegions', authenticationMiddleware, async (req, res) => {
    let res_get_regions = {
        status_code: 500,
        data: {},
    };

    try {
        const row = await adminDBC.getRegions();
        res_get_regions.status_code = 200;
        res_get_regions.data = row;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_regions.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 시스템 코드 목록 조회
router.get('/getSystemCode', authenticationMiddleware, async (req, res) => {
    let res_get_code = {
        status_code: 500,
        data: {},
    };

    try {
        const row = await adminDBC.getSystemCode(req.query.uxId);

        //depth 만들기
        const buildMenuTree = (codeData) => {
            const codeMap = {};
            const rootCode = [];

            // Create a menuMap for efficient lookup
            for (const code of codeData) {
                code.leafs = [];
                codeMap[code.value] = code;
            }

            // Build the menu tree
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

        res_get_code.status_code = 200;
        res_get_code.data = buildMenuTree(row);
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_code.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 컨텐츠 목록 조회
router.get('/getContents', authenticationMiddleware, async (req, res) => {
    let res_get_contents = {
        status_code: 500,
        data: {},
    };

    try {
        const { totalCount, row } = await adminDBC.getContents(req.query);
        res_get_contents.status_code = 200;
        res_get_contents.data = {
            ...totalCount[0],
            list: row,
        };
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_contents.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 목록 조회
router.post('/getFAQs', authenticationMiddleware, async (req, res) => {
    let res_get_faqs = {
        status_code: 500,
        data: {},
    };

    try {
        const { totalCount, row } = await adminDBC.getFAQs(req.body);
        res_get_faqs.status_code = 200;
        res_get_faqs.data = {
            ...totalCount[0],
            list: row,
        };
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqs.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 상세 조회
router.get('/faqDetails', authenticationMiddleware, async (req, res) => {
    let res_get_faqDetails = {
        status_code: 500,
        data: {},
    };

    try {
        const row = await adminDBC.getFAQDetails(req.query.noId);
        res_get_faqDetails.status_code = 200;
        res_get_faqDetails.data = { ...row, poc: row.poc.split(',') };
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 상세 수정
router.put('/faqDetails/:noId', authenticationMiddleware, async (req, res) => {
    let res_get_faqDetails = {
        status_code: 500,
        data: {},
    };

    try {
        await adminDBC.putFAQDetails({
            ...req.body,
            noId: req.params.noId,
            updateId: req.headers.adminid,
        });
        res_get_faqDetails.status_code = 200;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 등록
router.post('/faqDetails', authenticationMiddleware, async (req, res) => {
    let res_get_faqDetails = {
        status_code: 500,
        data: {},
    };

    try {
        await adminDBC.postFAQDetails({
            ...req.body,
            updateId: req.headers.adminid,
        });
        res_get_faqDetails.status_code = 200;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 개별 삭제
router.delete('/faqDetails/:noId', authenticationMiddleware, async (req, res) => {
    let res_get_faqDetails = {
        status_code: 500,
        data: {},
    };

    try {
        await adminDBC.deleteFAQs(req.params.noId);
        res_get_faqDetails.status_code = 200;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//POC별 FAQ 목록 조회
router.get('/getTopFAQs', authenticationMiddleware, async (req, res) => {
    let res_get_pocFaqs = {
        status_code: 500,
        data: {},
    };

    try {
        const { totalCount, row } = await adminDBC.getTopFAQs(req.query.type);
        res_get_pocFaqs.status_code = 200;
        res_get_pocFaqs.data = {
            ...totalCount[0],
            list: row,
        };
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_pocFaqs.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//POC 별 FAQ(자주찾는질문) 추가
router.put('/topFAQsDetails/:poc', authenticationMiddleware, async (req, res) => {
    let res_get_faqDetails = {
        status_code: 500,
        data: {},
    };

    try {
        await adminDBC.putTopFAQs(req.body);
        res_get_faqDetails.status_code = 200;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//POC 별 FAQ 순서 변경
router.post('/topFAQsDetails/order', authenticationMiddleware, async (req, res) => {
    let res_get_faqDetails = {
        status_code: 500,
        data: {},
    };

    try {
        await adminDBC.putTopFAQsOrder(req.body);
        res_get_faqDetails.status_code = 200;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//POC 별 FAQ 삭제
router.put('/topFAQsDetails', authenticationMiddleware, async (req, res) => {
    let res_get_faqDetails = {
        status_code: 500,
        data: {},
    };

    try {
        await adminDBC.deleteTopFAQs(req.body);
        res_get_faqDetails.status_code = 200;
    } catch (error) {
        console.log(error.message);
    } finally {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

module.exports = router;

const express = require('express');
const adminDBC = require('../adminDB');
const router = express.Router();

// 관리자 정보 조회
router.get('/getAdmins', async (req, res)=>
{
    const adminId = req.headers.adminid
    let res_get_admins= 
    {
        status_code : 500,
        admins : {} 
    };

    try
    {
        const row = await adminDBC.getAdmins(adminId);
        res_get_admins.status_code = 200;
        {
            res_get_admins.admins = row[0];
        }
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_admins.admins,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// depth 별 메뉴 조회
router.get('/getTopMenus', async (req, res)=>
{
    let res_get_menus= 
    {
        status_code : 500,
        menus : {} 
    };

    try
    {
        const row = await adminDBC.getTopMenus();
        res_get_menus.status_code = 200;
        res_get_menus.menus = row
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_menus.menus,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 1 depth 별 2 depth 메뉴 조회
router.post('/getSideMenus', async (req, res)=>
{
    const parentId = req.body.parentId
    let res_get_menus= 
    {
        status_code : 500,
        menus : {} 
    };

    try
    {
        const row = await adminDBC.getSideMenus(parentId);
        res_get_menus.status_code = 200;
        res_get_menus.menus = row
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_menus.menus,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 트리 메뉴 조회
router.get('/getTreeMenus', async (req, res)=>
{
    
    let res_get_menus= 
    {
        status_code : 500,
        menus : {} 
    };

    try
    {
        const row = await adminDBC.getTreeMenus();
        res_get_menus.status_code = 200;
        res_get_menus.menus = row
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_menus.menus,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 메뉴 상세 조회
router.get('/getMenuDetails', async (req, res)=>
{
    let res_get_details= 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        // 메뉴 1개 당 region 별 언어 매핑 
        const row = await adminDBC.getMenuDetails(req.query.menuId);
        res_get_details.status_code = 200;
        res_get_details.data = { 
            id: row[0].menuId,
            menuNm: row[0].menuNm,
            orderNo: row[0].orderNo,
            langList: row.map(region => ({ regionCd: region.regionCd, regionNm: region.regionNm, languageNm: region.mlNm })),
        }
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_details.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 리전 목록 조회
router.get('/getRegions', async (req, res)=>
{
    let res_get_regions= 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        const row = await adminDBC.getRegions();
        res_get_regions.status_code = 200;
        res_get_regions.data = row
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_regions.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 시스템 코드 목록 조회
router.get('/getSystemCode', async (req, res)=>
{
    let res_get_code= 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        const row = await adminDBC.getSystemCode(req.query.uxId);

        //depth 만들기
        const buildMenuTree = (codeData) => {
            const codeMap = {}
            const rootCode = []
          
            // Create a menuMap for efficient lookup
            for (const code of codeData) {
              code.leafs = []
              codeMap[code.value] = code
            }
          
            // Build the menu tree
            for (const code of codeData) {
             const data = {
                id: code.id,
                name: code.name,
                value: code.value,
                depth: code.depth,
                leafs: code.leafs ?? []
             } 

              const categoryId = code.category
              if (categoryId) {
                const parentCode = codeMap[categoryId]
                parentCode.leafs.push(data)
              } else {
                rootCode.push(data)
              }
            }
          
            return rootCode
        }
        
        res_get_code.status_code = 200;
        res_get_code.data = buildMenuTree(row)
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_code.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

// 컨텐츠 목록 조회
router.get('/getContents', async (req, res)=>
{
    let res_get_contents = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        const { totalCount, row } = await adminDBC.getContents(req.query);
        res_get_contents.status_code = 200;
        res_get_contents.data = {
            ...totalCount[0],
            list: row
        }
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_contents.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 목록 조회
router.post('/getFAQs', async (req, res)=>
{
    let res_get_faqs = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        const { totalCount, row } = await adminDBC.getFAQs(req.body);
        res_get_faqs.status_code = 200;
        res_get_faqs.data = {
            ...totalCount[0],
            list: row
        }
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqs.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 상세 조회
router.get('/faqDetails', async (req, res)=>
{
    
    let res_get_faqDetails = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        const row = await adminDBC.getFAQDetails(req.query.noId);
        res_get_faqDetails.status_code = 200;
        res_get_faqDetails.data = { ...row, poc: row.poc.split(",") }
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 상세 수정
router.put('/faqDetails/:noId', async (req, res)=> 
{
    let res_get_faqDetails = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        await adminDBC.putFAQDetails({ ...req.body, noId: req.params.noId ,updateId: req.headers.adminid });
        res_get_faqDetails.status_code = 200;
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
})

//FAQ 등록
router.post('/faqDetails', async (req, res)=>
{
    let res_get_faqDetails = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        await adminDBC.postFAQDetails({ ...req.body, updateId: req.headers.adminid });
        res_get_faqDetails.status_code = 200;
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//FAQ 개별 삭제
router.delete('/faqDetails/:noId', async (req, res)=> 
{
    let res_get_faqDetails = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        await adminDBC.deleteFAQs(req.params.noId);
        res_get_faqDetails.status_code = 200;
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
})

//POC별 FAQ 목록 조회
router.get('/getTopFAQs', async (req, res)=>
{
    
    let res_get_pocFaqs = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        const { totalCount, row } = await adminDBC.getTopFAQs(req.query.type);
        res_get_pocFaqs.status_code = 200;
        res_get_pocFaqs.data = { 
            ...totalCount[0], 
            list: row
        }
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_pocFaqs.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

//POC 별 FAQ(자주찾는질문) 추가
router.put('/topFAQsDetails/:poc', async (req, res)=> 
{
    let res_get_faqDetails = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        await adminDBC.putTopFAQs(req.body)
        res_get_faqDetails.status_code = 200;
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
})

//POC 별 FAQ 순서 변경
router.post('/topFAQsDetails/order', async (req, res)=> 
{
    let res_get_faqDetails = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        await adminDBC.putTopFAQsOrder(req.body)
        res_get_faqDetails.status_code = 200;
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
})

//POC 별 FAQ 삭제
router.put('/topFAQsDetails', async (req, res)=> 
{
    let res_get_faqDetails = 
    {
        status_code : 500,
        data : {} 
    };

    try
    {
        await adminDBC.deleteTopFAQs(req.body)
        res_get_faqDetails.status_code = 200;
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {
        res.send({
            data: res_get_faqDetails.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
})


module.exports = router;
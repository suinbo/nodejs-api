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
            headers: {},
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
            headers: {},
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
            headers: {},
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
            headers: {},
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
            headers: {},
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
            headers: {},
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
            headers: {},
            data: res_get_code.data,
            code: '0000',
            detailMessage: 'success.',
        });
    }
});

module.exports = router;
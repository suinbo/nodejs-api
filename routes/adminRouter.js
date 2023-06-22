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

module.exports = router;
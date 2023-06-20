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
            detailMessage: 'login success.',
        });
    }
});

module.exports = router;
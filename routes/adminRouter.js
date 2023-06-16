const express = require('express');
const adminDBC = require('../adminDB');
const router = express.Router();

// 관리자 정보 조회
router.get('/getAdmins', async (req, res)=>
{
    let res_get_admins= 
    {
        status_code : 500,
        admins : [] 
    };

    try
    {
        const rows = await adminDBC.getAdmins();
        res_get_admins.status_code = 200;
        if(rows.length > 0)
        {
            rows.forEach((admin)=>
            {
                res_get_admins.admins.push
                ({
                    id : admin.id,
                    password : admin.password,
                    name : admin.name,
                    insertDt : admin.insertDt
                });
            });
        }
        else
        {
            console.log('사용자 없음');
        }
    }
    catch(error)
    {
        console.log(error.message);
    }
    finally
    {

        //응답 
        const result =  res_get_admins.admins.map(admin => ({
            id: admin.id,
            password: admin.password,
            name: admin.name,
            insertDt: admin.insertDt
        }))

        res.send(result);
    }
});

module.exports = router;
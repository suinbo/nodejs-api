const mysql = require('mysql2');

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool
({
  host: 'localhost',
  user: 'root',
  database: 'office',
  password: '1234',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const getAdmins = async (adminId)=>
{
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from admin where id = '${adminId}';`);
    return row;
};

const getTopMenus = async ()=>
{
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from menu where depth = 1;`);
    return row;
};

const getSideMenus = async (parentId)=>
{
    const promisePool = pool.promise();
    const [allMenus] = await promisePool.query(`select * from menu;`);
    const [sideMenus] = await promisePool.query(`select * from menu where parentId = '${parentId}';`);

    const result = sideMenus.map(menu => ({
      ...menu,
      leafs: allMenus.filter(data => data.parentId == menu.id).map(item => ({ ...item, leafs: []}))
    }))
    
    return result;
};

module.exports = 
{
  getAdmins,
  getTopMenus,
  getSideMenus
};
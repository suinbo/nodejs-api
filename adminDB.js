const mysql = require('mysql2');

// Create the connection pool
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

    return sideMenus.map(menu => ({
      ...menu,
      leafs: allMenus.filter(data => data.parentId == menu.id).map(item => ({ ...item, leafs: [] }))
    }));
};

/** 트리 메뉴 조회 */
const getTreeMenus = async ()=>
{
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from menu;`);

    const buildMenuTree = (menuData) => {
      const menuMap = {}
      const rootMenu = []
    
      // Create a menuMap for efficient lookup
      for (const menu of menuData) {
        menu.leafs = []
        menuMap[menu.id] = menu
      }
    
      // Build the menu tree
      for (const menu of menuData) {
        const parentId = menu.parentId
        if (parentId) {
          const parentMenu = menuMap[parentId]
          parentMenu.leafs.push(menu)
        } else {
          rootMenu.push(menu)
        }
      }
    
      return rootMenu
    }
    return buildMenuTree(row);
};

const getMenuDetails = async (menuId)=>
{
    const promisePool = pool.promise();
    const [row] = await promisePool.query(
      `SELECT * FROM menu a 
       join menulanguage b on a.id = b.mId 
       join region c on c.rdx = b.rdx
       where a.id = '${menuId}';`);
    return row;
};

const getRegions = async ()=>
{
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from region;`);
    return row;
};

module.exports = 
{
  getAdmins,
  getTopMenus,
  getSideMenus,
  getTreeMenus,
  getMenuDetails,
  getRegions
};
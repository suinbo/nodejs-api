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
    const promisePool = pool.promise(); // promise 기반 MySQL 연결 풀 생성
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

const getSystemCode = async (uxId)=>
{
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from code where uxId = '${uxId}';`);
    return row;
};

const getContents = async (params)=>
{
    const { type, keywords, pageNo } = params
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from contents where ${type} like '%${keywords}%';`);
    const [row] = await promisePool.query(`select * from contents where ${type} like '%${keywords}%' limit 10 offset ${(pageNo - 1) * 10};`);
    return { totalCount, row };
};

const getFAQs = async (params)=>
{
  
    const { sType, search, page, order, orderType, category, viewYn } = params
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from faq where ${sType} like '%${search}%';`);
    const [row] = await promisePool.query(
      `select a.*, b.name as category from faq a
      join code b on a.category = b.value
      where ${sType} like '%${search}%' 
      ${category.length ? `and a.category in (${category.map(c => `'${c}'`).join(",")})`: ""}
      ${viewYn ? `and a.viewYn = ${viewYn}`: ""}
      order by ${orderType} ${order} 
      limit 10 offset ${(page - 1) * 10};`
    );
    return { totalCount, row };
};

const getFAQDetails = async (noId)=>
{
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from faq where noId='${noId}';`);
    return row[0];
};

module.exports = 
{
  getAdmins,
  getTopMenus,
  getSideMenus,
  getTreeMenus,
  getMenuDetails,
  getRegions,
  getSystemCode,
  getContents,
  getFAQs,
  getFAQDetails
};
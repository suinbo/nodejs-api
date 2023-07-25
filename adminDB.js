const mysql = require('mysql2');

// 프로미스 기반으로 쿼리 결과에 접근
const mysqlPromise = require('mysql2/promise');

// Create the connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'office',
    password: '123456',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// MySQL 연결 설정
const connectionConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'office',
};

// 특정 유저의 세션 ID 조회
const findSessionIdByAdminId = async (sessionId) => {
    try {
        // MySQL 데이터베이스와 연결
        const connection = await mysqlPromise.createConnection(connectionConfig);

        // express-mysql-session의 get 메서드를 사용하여 해당 유저의 세션 정보를 조회
        const [rows] = await connection.query(`select data from sessions where session_id = ?`, [sessionId]);

        // 세션의 관리자 ID 반환
        if (!!rows.length) {
            return JSON.parse(rows[0].data).adminId;
        } else {
            return null; // 해당 유저의 세션 ID가 없을 경우 null 반환
        }
    } catch (error) {
        console.error('Error while finding session ID:', error);
        return null; // 오류 발생 시 null 반환
    }
};

const postLogin = async (params) => {
    const { accessId, secretPw } = params;

    const promisePool = pool.promise(); // promise 기반 MySQL 연결 풀 생성

    const query = `select * from admin where id = ? and password = ? ;`;

    const values = [accessId, secretPw];

    const [row] = await promisePool.query(query, values);
    return row;
};

const postLogout = async (params) => {};

const getRegions = async () => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from region;`);
    return row;
};

const getLanguages = async () => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from language;`);
    return row;
};

const getTimezones = async () => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from timezone;`);
    return row;
};

const getAdmins = async (adminId) => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from admin where id = '${adminId}';`);
    return row;
};

const getAccessHistory = async (adminId) => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from accesshistory where adminId = '${adminId}';`);
    return row;
};

const getTopMenus = async () => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from menu where depth = 1;`);
    return row;
};

const getSideMenus = async (parentId) => {
    const promisePool = pool.promise();
    const [allMenus] = await promisePool.query(`select * from menu;`);
    const [sideMenus] = await promisePool.query(`select * from menu where parentId = '${parentId}';`);

    return sideMenus.map((menu) => ({
        ...menu,
        leafs: allMenus.filter((data) => data.parentId == menu.id).map((item) => ({ ...item, leafs: [] })),
    }));
};

/** 트리 메뉴 조회 */
const getTreeMenus = async () => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from menu;`);

    const buildMenuTree = (menuData) => {
        const menuMap = {};
        const rootMenu = [];

        // Create a menuMap for efficient lookup
        for (const menu of menuData) {
            menu.leafs = [];
            menuMap[menu.id] = menu;
        }

        // Build the menu tree
        for (const menu of menuData) {
            const parentId = menu.parentId;
            if (parentId) {
                const parentMenu = menuMap[parentId];
                parentMenu.leafs.push(menu);
            } else {
                rootMenu.push(menu);
            }
        }

        return rootMenu;
    };
    return buildMenuTree(row);
};

const getMenuDetails = async (menuId) => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(
        `SELECT * FROM menu a 
       join menulanguage b on a.id = b.mId 
       join region c on c.noId = b.rdx
       where a.id = '${menuId}';`
    );
    return row;
};

const getSystemCode = async (uxId) => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from code where uxId = '${uxId}';`);
    return row;
};

const getContents = async (params) => {
    const { type, keywords, pageNo } = params;
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from contents where ${type} like '%${keywords}%';`);
    const [row] = await promisePool.query(`select * from contents where ${type} like '%${keywords}%' limit 10 offset ${(pageNo - 1) * 10};`);
    return { totalCount, row };
};

const getFAQs = async (params) => {
    const { sType, search, page, order, orderType, category, viewYn, poc } = params;
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from faq where ${sType} like '%${search}%';`);
    const [row] = await promisePool.query(
        `select a.*, b.name as category from faq a
      join code b on a.category = b.value
      where ${sType} like '%${search}%' 
      ${category.length ? `and a.category in (${category.map((c) => `'${c}'`).join(',')})` : ''}
      ${viewYn ? `and a.viewYn = ${viewYn}` : ''}
      ${poc ? `and a.poc like '%${poc}%'` : ''}
      ${orderType ? `order by ${orderType} ${order}` : ''}
      limit 10 offset ${(page - 1) * 10};`
    );
    return { totalCount, row };
};

const getFAQDetails = async (noId) => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from faq where noId='${noId}';`);
    return row[0];
};

const postFAQDetails = async (params) => {
    const { title, category, viewYn, poc, viewDt, content, reserveYn, updateId } = params;

    try {
        // MySQL 연결
        const connection = await mysqlPromise.createConnection(connectionConfig);

        // INSERT 문 쿼리
        const query = `insert into faq (orderNo, title, category, viewYn, poc, viewDt, content, reserveYn, updateDt, updateId) 
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const subquery = 'SELECT MAX(orderNo) as maxOrderNo FROM faq';
        const [rows] = await connection.query(subquery);
        const maxOrderNo = rows[0].maxOrderNo;

        // INSERT 문 파라미터
        const values = [maxOrderNo + 1, title, category, viewYn, poc.join(','), viewDt, content, reserveYn, new Date(), updateId];

        // INSERT 문 실행
        const [result] = await connection.query(query, values);

        // 삽입된 행의 ID 확인
        console.log('Inserted ID:', result.insertId);

        // 연결 종료
        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const putFAQDetails = async (params) => {
    const { noId, title, category, viewYn, poc, viewDt, content, reserveYn, updateId } = params;

    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const query = `UPDATE faq
      SET title = ?, category = ?, viewYn = ?, poc = ?, viewDt = ?, content = ?, reserveYn = ?, updateId = ?
      WHERE noId = ?`;

        const values = [title, category, viewYn, poc.join(','), viewDt, content, reserveYn, updateId, noId];

        await connection.query(query, values);

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const getTopFAQs = async (pocType) => {
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from faq where poc like '%${pocType}%' and topYn = 1;`);
    const [row] = await promisePool.query(`
      select a.*, b.name as category from faq a
      join code b on a.category = b.value
      where poc like '%${pocType}%' and topYn = 1 order by orderNo desc;
      `);
    return { totalCount, row };
};

const putTopFAQs = async (params) => {
    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const query = `update faq set topYn = 1 where noId in (?)`;

        const values = [params.ids];

        await connection.query(query, values);

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const putTopFAQsOrder = async (params) => {
    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const query = `update faq set orderNo = case when orderNo = ? then ? else ? end where orderNo IN (?, ?);`;

        const values = [params.noId, params.newOrderNo, params.noId, params.noId, params.newOrderNo];

        await connection.query(query, values);

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const deleteFAQs = async (noId) => {
    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const query = `delete from faq where noId = ?;`;

        await connection.query(query, noId);

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const deleteTopFAQs = async (params) => {
    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const query = `update faq set topYn = 0 where noId in (?);`;

        const values = [params.ids];

        await connection.query(query, values);

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

module.exports = {
    findSessionIdByAdminId,
    postLogin,
    postLogout,
    getLanguages,
    getTimezones,
    getAdmins,
    getAccessHistory,
    getTopMenus,
    getSideMenus,
    getTreeMenus,
    getMenuDetails,
    getRegions,
    getSystemCode,
    getContents,
    getFAQs,
    getFAQDetails,
    postFAQDetails,
    putFAQDetails,
    getTopFAQs,
    putTopFAQs,
    putTopFAQsOrder,
    deleteTopFAQs,
    deleteFAQs,
};

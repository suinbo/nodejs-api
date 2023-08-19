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

const putAccessHistory = async (params) => {
    const { historyDesc, historyDate, ip, id } = params;

    const promisePool = pool.promise(); // promise 기반 MySQL 연결 풀 생성

    const query = `insert into accesshistory (historyDesc, historyDate, ip, adminId) 
        values (?, ?, ?, ?)`;

    const values = [historyDesc, historyDate, ip, id];

    const [row] = await promisePool.query(query, values);
    return row;
};

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
    const [row] = await promisePool.query(`select * from admin where id = ?;`, adminId);
    return row;
};

const putAdmins = async (adminId, params) => {
    const { tel, email, department, langCode, timeCode } = params;

    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const query = `UPDATE admin
            SET tel = ?, email = ?, department = ?, langCode = ?, timeCode = ?, updateDt = ?
            WHERE id = ?`;

        const values = [decodeURIComponent(tel), decodeURIComponent(email), department, langCode, timeCode, new Date(), adminId];

        await connection.query(query, values);

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const getPassword = async (adminId) => {
    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const [result] = await connection.query(`SELECT password FROM admin WHERE id = ?;`, [adminId]);

        return result[0].password;
    } catch (error) {
        console.error('Error:', error);
    }
};

const putPassword = async (adminId, newSecretPw) => {
    try {
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const query = `UPDATE admin SET password = ? WHERE id = ?;`;

        const values = [newSecretPw, adminId];

        await connection.query(query, values);

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const getAccessHistory = async (adminId, pageNo) => {
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from accesshistory;`);
    const [row] = await promisePool.query(
        `
    select * from accesshistory where adminId = ? order by noId desc 
    limit 10 offset ?`,
        [adminId, (pageNo - 1) * 10]
    );
    return { totalCount, row };
};

const getTopMenus = async () => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from menu where depth = 1;`);
    return row;
};

const getSideMenus = async (parentId) => {
    const promisePool = pool.promise();
    const [allMenus] = await promisePool.query(`select * from menu;`);
    const [sideMenus] = await promisePool.query(`select * from menu where parentId = ?;`, parentId);

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
       join menulanguage b on a.menuId = b.menuId 
       join region c on c.regionCd = b.regionCd
       where a.menuId = ?;`,
        menuId
    );
    return row;
};

const putMenuDetails = async (menuId, params) => {
    try {
        const { viewYn, orderNo, menuNm, desc, langList } = params;
        const connection = await mysqlPromise.createConnection(connectionConfig);

        // 메뉴 상세 수정
        const query = `update menu set viewYn = ?, orderNo = ?, menuNm = ?, \`desc\` = ? where menuId = ?;`;
        const values = [viewYn, orderNo, menuNm, desc, menuId];

        await connection.query(query, values);

        if (langList.length) {
            // menuId 매핑된 튜플 삭제
            await connection.query(`delete from menulanguage where menuId = ?;`, [menuId]);
            // 리전별 메뉴명 삽입(수정)
            await langList.map((language) => {
                const insertMenuNm = `
                INSERT INTO menulanguage (regionCd, menuNm, menuId) 
                VALUES (?, ?, ?);
            `;
                connection.query(insertMenuNm, [language.regionCd, language.menuNm, menuId]);
            });
        }

        connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
};

const postMenuDetails = async (params) => {
    try {
        const { id, parentId, depth, orderNo } = params;
        const connection = await mysqlPromise.createConnection(connectionConfig);

        const insertMenu = `insert into menu (id, menuId, viewYn, depth, menuNm, parentId, url, uxId, orderNo, \`desc\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

        const insertMenuLanguage = `insert into menulanguage (regionCd, menuNm, menuId)
        VALUES (?, ?, ?);`;

        const menuId = `menu${id}`;
        const menuValues = [id, menuId, 1, depth, '새 메뉴', parentId, '', `MENU${id}`, orderNo, ''];
        const languageValues = ['KR', '새 메뉴', menuId];

        await connection.query(insertMenu, menuValues);
        await connection.query(insertMenuLanguage, languageValues);

        connection.end();

        return { menuId, id, depth };
    } catch (error) {
        console.error('Error:', error);
    }
};

const deleteMenuDetails = async (menuId) => {
    const connection = await mysqlPromise.createConnection(connectionConfig);

    await connection.query(`delete from menu where menuId = ?;`, menuId);

    connection.end();
};

const getSystemCode = async (uxId) => {
    const promisePool = pool.promise();
    const [row] = await promisePool.query(`select * from code where uxId = ?;`, uxId);
    return row;
};

const getContents = async (params) => {
    const { type, keywords, pageNo } = params;
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from contents where ${type} like ?;`, [`%${keywords}%`]);
    const [row] = await promisePool.query(`select * from contents where ${type} like ? limit 10 offset ?;`, [`%${keywords}%`, (pageNo - 1) * 10]);
    return { totalCount, row };
};

const getFAQs = async (params) => {
    const { sType, search, page, order, orderType, category, viewYn, poc } = params;
    const promisePool = pool.promise();
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from faq where ${sType} like ?;`, [`%${search}%`]);
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
    const [row] = await promisePool.query(`select * from faq where noId = ?;`, noId);
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
    const [totalCount] = await promisePool.query(`select count(*) as totalCount from faq where poc like ? and topYn = 1;`, `%${pocType}%`);
    const [row] = await promisePool.query(
        `
      select a.*, b.name as category from faq a
      join code b on a.category = b.value
      where poc like ? and topYn = 1 order by orderNo desc;
      `,
        `%${pocType}%`
    );
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
    putAccessHistory,
    getLanguages,
    getTimezones,
    getAdmins,
    putAdmins,
    getPassword,
    putPassword,
    getAccessHistory,
    getTopMenus,
    getSideMenus,
    getTreeMenus,
    getMenuDetails,
    putMenuDetails,
    postMenuDetails,
    deleteMenuDetails,
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

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

module.exports = 
{
  getAdmins
};
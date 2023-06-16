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

const getAdmins = async ()=>
{
    const promisePool = pool.promise();
    const [rows] = await promisePool.query('select * from admin;');
    console.log(rows);
    return rows;
};

module.exports = 
{
  getAdmins
};
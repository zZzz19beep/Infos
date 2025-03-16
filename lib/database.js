// 数据库工厂，使用SQLite本地数据库
const sqlite = require('./sqlite');

// 始终使用 SQLite
const dbType = 'sqlite';

/**
 * 连接到数据库
 */
async function connectToDatabase() {
  console.log('使用SQLite数据库');
  return sqlite.connectToDatabase();
}

/**
 * 获取数据库模型
 */
function getModels() {
  // 返回 SQLite 模型
  return {
    User: sqlite.User,
    ContentGroup: sqlite.ContentGroup,
    Document: sqlite.Document,
    Summary: sqlite.Summary
  };
}

module.exports = {
  connectToDatabase,
  getModels
}; 
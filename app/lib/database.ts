// 数据库工厂，使用SQLite本地数据库
import { connectToDatabase as connectToSQLite, User, ContentGroup, Document, Summary } from './sqlite';

// 始终使用 SQLite
const dbType = 'sqlite';

export async function connectToDatabase() {
  console.log('使用SQLite数据库');
  return connectToSQLite();
}

// 数据库模型工厂
export function getModels() {
  // 返回 SQLite 模型
  return {
    User,
    ContentGroup,
    Document,
    Summary
  };
}

export default {
  connectToDatabase,
  getModels
}; 
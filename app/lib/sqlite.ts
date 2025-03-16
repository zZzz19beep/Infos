import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';

// 创建数据库文件路径
const dbPath = path.join(process.cwd(), 'markdown-explorer.sqlite');

// 创建Sequelize实例
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log,
});

// 定义模型
// 用户模型
class User extends Model {}
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  image: {
    type: DataTypes.STRING,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'User',
  timestamps: true,
});

// 内容组模型
class ContentGroup extends Model {}
ContentGroup.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.BIGINT,
    defaultValue: () => Date.now(),
  },
}, {
  sequelize,
  modelName: 'ContentGroup',
  timestamps: true,
});

// 文档模型
class Document extends Model {}
Document.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentPath: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  isDirectory: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Document',
  timestamps: true,
  indexes: [
    {
      fields: ['groupId', 'path'],
      unique: true,
    }
  ]
});

// 摘要模型
class Summary extends Model {}
Summary.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.BIGINT,
    defaultValue: () => Date.now(),
  },
  model: {
    type: DataTypes.STRING,
    defaultValue: 'deepseek-chat',
  },
}, {
  sequelize,
  modelName: 'Summary',
  timestamps: true,
  indexes: [
    {
      fields: ['documentId'],
      unique: true,
    }
  ]
});

// 设置关联关系
User.hasMany(ContentGroup, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
  },
});
ContentGroup.belongsTo(User, { foreignKey: 'userId' });

ContentGroup.hasMany(Document, {
  foreignKey: {
    name: 'groupId',
    allowNull: false,
  },
});
Document.belongsTo(ContentGroup, { foreignKey: 'groupId' });

Document.hasOne(Summary, {
  foreignKey: {
    name: 'documentId',
    allowNull: false,
  },
});
Summary.belongsTo(Document, { foreignKey: 'documentId' });

// 导出模型和数据库实例
export { User, ContentGroup, Document, Summary, sequelize };

// 连接到数据库并同步模型到数据库结构
export async function connectToDatabase() {
  try {
    await sequelize.authenticate();
    console.log('已成功连接到SQLite数据库!');
    
    // 同步所有模型
    await sequelize.sync();
    console.log('所有模型都已与数据库同步');
    
    return sequelize;
  } catch (error) {
    console.error('无法连接到SQLite数据库:', error);
    throw error;
  }
}

export default connectToDatabase; 
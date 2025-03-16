const { Sequelize, DataTypes, Model } = require('sequelize');
const path = require('path');

// 创建数据库文件路径
const dbPath = path.join(process.cwd(), 'markdown-explorer.sqlite');

// 创建Sequelize实例
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // 生产环境关闭日志
});

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
    unique: true,
  },
  name: DataTypes.STRING,
  image: DataTypes.STRING,
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
  name: DataTypes.STRING,
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
  name: DataTypes.STRING,
  path: DataTypes.STRING,
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
});

// 摘要模型
class Summary extends Model {}
Summary.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: DataTypes.TEXT,
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
});

// 设置关联关系
User.hasMany(ContentGroup, { foreignKey: 'userId' });
ContentGroup.belongsTo(User, { foreignKey: 'userId' });

ContentGroup.hasMany(Document, { foreignKey: 'groupId' });
Document.belongsTo(ContentGroup, { foreignKey: 'groupId' });

Document.hasOne(Summary, { foreignKey: 'documentId' });
Summary.belongsTo(Document, { foreignKey: 'documentId' });

// 导出模型和连接函数
module.exports = {
  User,
  ContentGroup,
  Document,
  Summary,
  sequelize,
  connectToDatabase: async function() {
    try {
      await sequelize.authenticate();
      console.log('已成功连接到SQLite数据库!');
      await sequelize.sync();
      console.log('所有模型都已与数据库同步');
      return sequelize;
    } catch (error) {
      console.error('无法连接到SQLite数据库:', error);
      throw error;
    }
  }
}; 
// 完整的SQLite数据库测试
const { Sequelize, DataTypes, Model } = require('sequelize');
const path = require('path');

// 创建数据库文件路径
const dbPath = path.join(process.cwd(), 'complete-test.sqlite');
console.log('数据库路径:', dbPath);

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

// 测试数据库连接和模型
async function testDatabase() {
  try {
    console.log('测试连接到SQLite数据库...');
    await sequelize.authenticate();
    console.log('连接成功！');

    console.log('同步模型...');
    await sequelize.sync({ force: true });
    console.log('模型同步成功！');

    // 创建测试用户
    const user = await User.create({
      email: 'test@example.com',
      name: '测试用户',
    });
    console.log('创建用户成功:', user.toJSON());

    // 创建测试内容组
    const contentGroup = await ContentGroup.create({
      name: '测试内容组',
      userId: user.id,
      timestamp: Date.now(),
    });
    console.log('创建内容组成功:', contentGroup.toJSON());

    // 创建测试文档
    const document = await Document.create({
      name: '测试文档.md',
      path: '/测试文档.md',
      content: '# 测试文档\n\n这是一个测试文档。',
      groupId: contentGroup.id,
      updatedAt: new Date(),
    });
    console.log('创建文档成功:', document.toJSON());

    // 创建测试摘要
    const summary = await Summary.create({
      content: '这是一个测试文档的摘要。',
      documentId: document.id,
      timestamp: Date.now(),
    });
    console.log('创建摘要成功:', summary.toJSON());

    // 查询测试
    console.log('\n执行查询测试...');

    const allContentGroups = await ContentGroup.findAll({ where: { userId: user.id } });
    console.log(`查询到 ${allContentGroups.length} 个内容组`);

    const allDocuments = await Document.findAll({ where: { groupId: contentGroup.id } });
    console.log(`查询到 ${allDocuments.length} 个文档`);

    const foundSummary = await Summary.findOne({ where: { documentId: document.id } });
    console.log('查询到摘要:', foundSummary?.toJSON());

    // 关联查询测试
    const userWithGroups = await User.findByPk(user.id, {
      include: ContentGroup
    });
    console.log('用户及其内容组:', JSON.stringify(userWithGroups.toJSON(), null, 2));

    const groupWithDocuments = await ContentGroup.findByPk(contentGroup.id, {
      include: Document
    });
    console.log('内容组及其文档:', JSON.stringify(groupWithDocuments.toJSON(), null, 2));

    const documentWithSummary = await Document.findByPk(document.id, {
      include: Summary
    });
    console.log('文档及其摘要:', JSON.stringify(documentWithSummary.toJSON(), null, 2));

    console.log('\n数据库测试完成，清理测试数据...');

    // 清理测试数据
    await Summary.destroy({ where: { documentId: document.id } });
    await Document.destroy({ where: { groupId: contentGroup.id } });
    await ContentGroup.destroy({ where: { userId: user.id } });
    await User.destroy({ where: { email: 'test@example.com' } });

    console.log('测试数据已清理');

    // 关闭连接
    await sequelize.close();
    console.log('数据库连接已关闭');

    return '测试成功';
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 运行测试
console.log('开始完整的SQLite数据库测试...');
testDatabase()
  .then(result => {
    console.log('\n结果:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n测试失败:', error);
    process.exit(1);
  }); 
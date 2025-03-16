// 完整的SQLite数据库测试
const { Sequelize, DataTypes, Model } = require('sequelize');
const path = require('path');

// 创建数据库文件路径
const dbPath = path.join(process.cwd(), 'test-full.sqlite');
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
  }
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
  }
}, {
  sequelize,
  modelName: 'ContentGroup',
  timestamps: true,
});

// 设置关联关系
User.hasMany(ContentGroup, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
  }
});
ContentGroup.belongsTo(User, { foreignKey: 'userId' });

// 测试函数
async function testDatabase() {
  try {
    // 连接到数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步模型
    await sequelize.sync({ force: true });
    console.log('模型同步成功');

    // 创建用户
    const user = await User.create({
      email: 'test@example.com',
      name: '测试用户'
    });
    console.log('用户创建成功:', user.toJSON());

    // 创建内容组
    const contentGroup = await ContentGroup.create({
      name: '测试内容组',
      userId: user.id
    });
    console.log('内容组创建成功:', contentGroup.toJSON());

    // 查询用户
    const foundUser = await User.findByPk(user.id, {
      include: [ContentGroup]
    });
    console.log('查询到用户:', foundUser.toJSON());
    console.log('用户的内容组:', foundUser.ContentGroups);

    // 查询内容组
    const foundContentGroups = await ContentGroup.findAll({
      where: { userId: user.id },
      include: [User]
    });
    console.log(`找到 ${foundContentGroups.length} 个内容组`);

    // 清理数据
    await ContentGroup.destroy({ where: { userId: user.id } });
    await User.destroy({ where: { id: user.id } });
    console.log('数据清理完成');

    // 关闭连接
    await sequelize.close();
    console.log('数据库连接已关闭');

    return '测试成功';
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 执行测试
console.log('开始测试...');
testDatabase()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 
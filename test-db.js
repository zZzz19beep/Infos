// 测试数据库连接的命令行脚本
const path = require("path");
// 导入Sequelize和相关依赖
const { Sequelize, DataTypes, Model } = require('sequelize');

console.log('开始测试SQLite数据库...');

// 创建数据库文件路径
const dbPath = path.join(process.cwd(), 'test-db.sqlite');
console.log('数据库路径:', dbPath);

// 创建Sequelize实例
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log,
});

// 定义简单的用户模型用于测试
class User extends Model {}
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  }
}, {
  sequelize,
  modelName: 'User'
});

async function testDatabase() {
  try {
    // 测试连接
    await sequelize.authenticate();
    console.log('数据库连接成功!');
    
    // 同步模型
    await sequelize.sync({ force: true });
    console.log('模型同步成功!');
    
    // 创建测试用户
    const user = await User.create({
      name: '测试用户',
      email: 'test@example.com'
    });
    console.log('创建用户成功:', user.toJSON());
    
    // 查询用户
    const users = await User.findAll();
    console.log(`查询到 ${users.length} 个用户`);
    
    // 删除用户
    await User.destroy({ where: { id: user.id } });
    console.log('用户删除成功');
    
    // 关闭连接
    await sequelize.close();
    console.log('数据库连接已关闭');
    
    return '测试成功!';
  } catch (error) {
    console.error('测试失败:', error);
    throw error;
  }
}

// 执行测试
console.log('开始执行数据库测试...');
testDatabase()
  .then(result => {
    console.log(result);
    console.log('测试完成!');
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 
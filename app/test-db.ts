import { connectToDatabase } from './lib/database';
import { User, ContentGroup, Document, Summary, sequelize } from './lib/sqlite';

async function testSQLiteDatabase() {
  try {
    console.log('测试SQLite数据库连接...');
    
    // 连接到数据库
    await connectToDatabase();
    console.log('SQLite数据库连接成功！');
    
    // 创建测试用户
    const user = await User.create({
      email: 'test@example.com',
      name: '测试用户',
    });
    console.log('创建测试用户成功:', user.toJSON());
    
    // 创建测试内容组
    const contentGroup = await ContentGroup.create({
      name: '测试内容组',
      userId: user.id,
      timestamp: Date.now(),
    });
    console.log('创建测试内容组成功:', contentGroup.toJSON());
    
    // 创建测试文档
    const document = await Document.create({
      name: '测试文档.md',
      path: '/测试文档.md',
      content: '# 测试文档\n\n这是一个测试文档。',
      groupId: contentGroup.id,
      updatedAt: new Date(),
    });
    console.log('创建测试文档成功:', document.toJSON());
    
    // 创建测试摘要
    const summary = await Summary.create({
      content: '这是一个测试文档的摘要。',
      documentId: document.id,
      timestamp: Date.now(),
    });
    console.log('创建测试摘要成功:', summary.toJSON());
    
    // 查询测试
    console.log('执行查询测试...');
    
    const allContentGroups = await ContentGroup.findAll({ where: { userId: user.id } });
    console.log(`查询到 ${allContentGroups.length} 个内容组`);
    
    const allDocuments = await Document.findAll({ where: { groupId: contentGroup.id } });
    console.log(`查询到 ${allDocuments.length} 个文档`);
    
    const foundSummary = await Summary.findOne({ where: { documentId: document.id } });
    console.log('查询到摘要:', foundSummary?.toJSON());
    
    console.log('数据库测试完成，清理测试数据...');
    
    // 清理测试数据
    await Summary.destroy({ where: { documentId: document.id } });
    await Document.destroy({ where: { groupId: contentGroup.id } });
    await ContentGroup.destroy({ where: { userId: user.id } });
    await User.destroy({ where: { email: 'test@example.com' } });
    
    console.log('测试数据已清理');
    
    return '测试成功';
  } catch (error) {
    console.error('数据库测试失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testSQLiteDatabase()
    .then(result => {
      console.log(result);
      process.exit(0);
    })
    .catch(error => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}

export default testSQLiteDatabase; 
import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt';
import { connectToDatabase, getModels } from '../../lib/database';
import mongoose from 'mongoose';

// 临时使用的默认用户ID
const DEFAULT_USER_ID = new mongoose.Types.ObjectId('6559943f9c42d2f1fed8dc01');

// 获取用户的所有内容组
export async function GET(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    console.log('正在尝试连接数据库获取内容组...');
    try {
      await connectToDatabase();
      console.log('数据库连接成功，正在查询内容组...');
    } catch (dbError) {
      console.error('数据库连接失败:', dbError);
      return NextResponse.json({ error: '数据库连接失败，请稍后再试' }, { status: 503 });
    }
    
    const { ContentGroup } = getModels();
    
    const contentGroups = await ContentGroup.find({ userId: DEFAULT_USER_ID })
      .sort({ timestamp: -1 })
      .lean();
    
    console.log(`查询到 ${contentGroups.length} 个内容组`);
    return NextResponse.json(contentGroups);
  } catch (error) {
    console.error('获取内容组失败:', error);
    return NextResponse.json({ error: '获取内容组失败' }, { status: 500 });
  }
}

// 创建新的内容组
export async function POST(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    console.log('开始处理内容组创建请求...');
    const { name, files } = await req.json();
    
    if (!name) {
      console.error('缺少内容组名称');
      return NextResponse.json({ error: '缺少内容组名称' }, { status: 400 });
    }
    
    console.log(`创建内容组: ${name}, 包含 ${files?.length || 0} 个文件`);
    
    try {
      await connectToDatabase();
      console.log('数据库连接成功，开始创建内容组...');
    } catch (dbError) {
      console.error('数据库连接失败:', dbError);
      return NextResponse.json({ error: '数据库连接失败，请稍后再试' }, { status: 503 });
    }
    
    const { ContentGroup, Document } = getModels();
    
    // 根据DB_TYPE决定是否使用事务
    const dbType = process.env.DB_TYPE || 'mongodb';
    
    if (dbType.toLowerCase() === 'mongodb') {
      // MongoDB 使用事务
      let session;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        console.log('MongoDB事务已开始');
        
        // 创建内容组
        const newGroup = await ContentGroup.create([{
          name,
          userId: DEFAULT_USER_ID,
          timestamp: Date.now()
        }], { session });
        
        const groupId = newGroup[0]._id;
        console.log('内容组已创建:', groupId);
        
        // 如果有文件，创建对应的文档
        if (files && files.length > 0) {
          const documents = files.map(file => ({
            name: file.name,
            groupId,
            path: file.path,
            parentPath: file.parentPath || '',
            content: file.content || '',
            isDirectory: file.isDirectory || false,
            updatedAt: new Date()
          }));
          
          await Document.create(documents, { session });
          console.log(`已创建 ${documents.length} 个文档`);
        }
        
        // 提交事务
        await session.commitTransaction();
        console.log('事务已提交');
        session.endSession();
        
        return NextResponse.json(newGroup[0]);
      } catch (error) {
        // 出错时回滚事务
        if (session) {
          await session.abortTransaction();
          session.endSession();
          console.error('事务已回滚:', error);
        }
        throw error;
      }
    } else {
      // SQLite 不使用事务，直接创建
      try {
        // 创建内容组
        const newGroup = await ContentGroup.create({
          name,
          userId: DEFAULT_USER_ID.toString(), // 在SQLite中需要转换为字符串
          timestamp: Date.now()
        });
        
        const groupId = newGroup.id;
        console.log('内容组已创建:', groupId);
        
        // 如果有文件，创建对应的文档
        if (files && files.length > 0) {
          const documents = files.map(file => ({
            name: file.name,
            groupId,
            path: file.path,
            parentPath: file.parentPath || '',
            content: file.content || '',
            isDirectory: file.isDirectory || false,
            updatedAt: new Date()
          }));
          
          await Document.bulkCreate(documents);
          console.log(`已创建 ${documents.length} 个文档`);
        }
        
        return NextResponse.json(newGroup);
      } catch (error) {
        console.error('创建内容组失败:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('创建内容组失败:', error);
    return NextResponse.json(
      { error: '创建内容组失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 
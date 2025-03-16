import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt';
import { connectToDatabase, getModels } from '../../lib/database';

// 获取文档
export async function GET(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // 获取查询参数
    const url = new URL(req.url);
    const groupId = url.searchParams.get('groupId');
    const path = url.searchParams.get('path');
    
    if (!groupId) {
      return NextResponse.json({ error: '缺少内容组ID' }, { status: 400 });
    }
    
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('数据库连接失败:', dbError);
      return NextResponse.json({ error: '数据库连接失败，请稍后再试' }, { status: 503 });
    }
    
    const { Document } = getModels();
    
    // 如果提供了path，返回指定文档
    if (path) {
      const document = await Document.findOne({ 
        groupId, 
        path 
      });
      
      if (!document) {
        return NextResponse.json({ error: '文档不存在' }, { status: 404 });
      }
      
      return NextResponse.json(document);
    }
    
    // 否则返回内容组中的所有文档
    const documents = await Document.find({ groupId });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('获取文档失败:', error);
    return NextResponse.json({ error: '获取文档失败' }, { status: 500 });
  }
}

// 更新文档
export async function PUT(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { id, content } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 });
    }
    
    if (content === undefined) {
      return NextResponse.json({ error: '缺少文档内容' }, { status: 400 });
    }
    
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('数据库连接失败:', dbError);
      return NextResponse.json({ error: '数据库连接失败，请稍后再试' }, { status: 503 });
    }
    
    const { Document } = getModels();
    
    const document = await Document.findByIdAndUpdate(
      id,
      { content, updatedAt: new Date() },
      { new: true }
    );
    
    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('更新文档失败:', error);
    return NextResponse.json({ error: '更新文档失败' }, { status: 500 });
  }
}

// 删除文档
export async function DELETE(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // 获取查询参数
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 });
    }
    
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('数据库连接失败:', dbError);
      return NextResponse.json({ error: '数据库连接失败，请稍后再试' }, { status: 503 });
    }
    
    const { Document } = getModels();
    
    const document = await Document.findByIdAndDelete(id);
    
    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文档失败:', error);
    return NextResponse.json({ error: '删除文档失败' }, { status: 500 });
  }
} 
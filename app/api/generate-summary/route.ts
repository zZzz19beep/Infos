import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt';
import { connectToDatabase, getModels } from '../../lib/database';
import crypto from 'crypto';

// 生成摘要API
export async function POST(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { documentId, content, model = 'deepseek-chat' } = await req.json();
    
    if (!documentId) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 });
    }
    
    if (!content) {
      return NextResponse.json({ error: '缺少摘要内容' }, { status: 400 });
    }
    
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('数据库连接失败:', dbError);
      return NextResponse.json({ error: '数据库连接失败，请稍后再试' }, { status: 503 });
    }
    
    const { Summary, Document } = getModels();
    
    // 检查文档是否存在
    const document = await Document.findById(documentId);
    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }
    
    // 检查是否已有摘要，有则更新，无则创建
    let summary = await Summary.findOne({ documentId });
    
    if (summary) {
      // 更新现有摘要
      summary.content = content;
      summary.timestamp = Date.now();
      summary.model = model;
      await summary.save();
    } else {
      // 创建新摘要
      summary = await Summary.create({
        documentId,
        content,
        timestamp: Date.now(),
        model
      });
    }
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('生成摘要失败:', error);
    return NextResponse.json({ error: '生成摘要失败' }, { status: 500 });
  }
}

// 获取文档摘要
export async function GET(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // 获取查询参数
    const url = new URL(req.url);
    const documentId = url.searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 });
    }
    
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('数据库连接失败:', dbError);
      return NextResponse.json({ error: '数据库连接失败，请稍后再试' }, { status: 503 });
    }
    
    const { Summary } = getModels();
    
    const summary = await Summary.findOne({ documentId });
    
    if (!summary) {
      return NextResponse.json({ error: '摘要不存在' }, { status: 404 });
    }
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('获取摘要失败:', error);
    return NextResponse.json({ error: '获取摘要失败' }, { status: 500 });
  }
} 
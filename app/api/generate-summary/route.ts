import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt';
import { connectToDatabase, getModels } from '../../lib/database';
import crypto from 'crypto';

// 支持的模型列表
export const SUPPORTED_MODELS = {
  'deepseek-chat': {
    name: 'DeepSeek Chat',
    description: '由DeepSeek提供的AI大模型'
  },
  // 后续可以添加更多模型
};

// 生成摘要API
export async function POST(req: NextRequest) {
  try {
    // 临时移除身份验证检查
    // const token = await getToken({ req });
    // if (!token || !token.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { documentId, content, model = 'deepseek-chat', forceRefresh = false } = await req.json();
    
    if (!documentId) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 });
    }
    
    if (!content) {
      return NextResponse.json({ error: '缺少摘要内容' }, { status: 400 });
    }
    
    // 验证模型是否支持
    if (!SUPPORTED_MODELS[model]) {
      return NextResponse.json({ error: `不支持的模型: ${model}` }, { status: 400 });
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
    
    // 检查是否已有摘要且不是强制刷新
    let summary = await Summary.findOne({ documentId });
    let cached = false;
    
    // 如果有缓存且不是强制刷新，且模型相同，直接返回缓存的摘要
    if (summary && !forceRefresh && summary.model === model) {
      cached = true;
      return NextResponse.json({ 
        summary: summary.content, 
        cached: true,
        timestamp: summary.timestamp,
        model: summary.model
      });
    }
    
    // 如果强制刷新或没有缓存，或者模型不同，则生成新摘要
    const aiSummary = await generateSummary(content, model);
    
    if (summary) {
      // 更新现有摘要
      summary.content = aiSummary;
      summary.timestamp = Date.now();
      summary.model = model;
      await summary.save();
    } else {
      // 创建新摘要
      summary = await Summary.create({
        documentId,
        content: aiSummary,
        timestamp: Date.now(),
        model
      });
    }
    
    return NextResponse.json({
      summary: aiSummary,
      cached: false,
      timestamp: Date.now(),
      model
    });
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

// 获取支持的模型列表
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({
    models: SUPPORTED_MODELS
  });
}

// 摘要生成工厂函数
async function generateSummary(content: string, model: string): Promise<string> {
  switch (model) {
    case 'deepseek-chat':
      return await generateSummaryWithDeepseekR1(content);
    // 后续可以添加更多模型的处理
    default:
      throw new Error(`不支持的模型: ${model}`);
  }
}

// 使用deepseek API生成摘要
async function generateSummaryWithDeepseekR1(content: string): Promise<string> {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'sk-2e42fb2d6a4a4f118859307cce9d1ec0'}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system', 
            content: '你是一个专业的文章摘要生成助手。请为用户提供的文章生成一个简洁明了的摘要，控制在200字以内。只需输出摘要内容，不要加入其他解释或评论。'
          },
          {
            role: 'user', 
            content: `请为以下文章生成摘要：\n\n${content}`
          }
        ],
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 从API响应中提取摘要内容
    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
      return result.choices[0].message.content;
    } else {
      throw new Error('无法从API响应中提取摘要');
    }
  } catch (error) {
    console.error('调用deepseek API失败:', error);
    // 如果API调用失败，返回一个基本的摘要
    const previewText = content.slice(0, 150).replace(/[#*]/g, '');
    return `摘要生成失败，这是内容预览：${previewText}...`;
  }
} 
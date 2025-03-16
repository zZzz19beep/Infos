'use client';

import { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import matter from 'gray-matter';
import { FileItem } from './FileUploader';
import { FiClock, FiCalendar, FiMessageCircle, FiArrowLeft, FiExternalLink, FiRefreshCw, FiChevronDown } from 'react-icons/fi';

interface ArticleDetailProps {
  article: FileItem;
  onBack: () => void;
}

// 模型类型定义
interface ModelInfo {
  name: string;
  description: string;
}

interface SupportedModels {
  [key: string]: ModelInfo;
}

export default function ArticleDetail({ article, onBack }: ArticleDetailProps) {
  // 摘要状态
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isCachedSummary, setIsCachedSummary] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('deepseek-chat');
  const [supportedModels, setSupportedModels] = useState<SupportedModels>({});
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const {
    content,
    title,
    date,
    summary,
    comments,
    source
  } = useMemo(() => {
    // ... existing code ...
// ... existing code ...

  // 获取支持的模型列表
  useEffect(() => {
    async function fetchSupportedModels() {
      try {
        const response = await fetch('/api/generate-summary', {
          method: 'OPTIONS'
        });
        
        if (response.ok) {
          const data = await response.json();
          setSupportedModels(data.models || {});
        }
      } catch (error) {
        console.error('获取支持的模型列表失败:', error);
      }
    }
    
    fetchSupportedModels();
  }, []);

  // 调用API生成摘要
  const fetchAiSummary = async (forceRefresh = false) => {
    if (!content) return;
    
    setIsLoadingSummary(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content,
          documentId: article.id, // 传递文档ID用于缓存
          forceRefresh, // 添加强制刷新参数
          model: currentModel // 传递当前选择的模型
        }),
      });
      
      if (!response.ok) {
        // 处理特定错误
        const errorData = await response.json();
        if (response.status === 503 && errorData.error?.includes('数据库连接')) {
          // 数据库连接问题，但仍然可以生成摘要，只是无法缓存
          console.warn('数据库连接失败，摘要将不会被缓存');
          // 使用内容的前150个字符作为简单摘要
          const simplePreview = content.slice(0, 250).replace(/[#*]/g, '');
          setAiSummary(`由于数据库连接问题，无法生成AI摘要。这是内容预览：${simplePreview}...`);
        } else {
          throw new Error(errorData.error || '摘要生成失败');
        }
      } else {
        const data = await response.json();
        setAiSummary(data.summary);
        setIsCachedSummary(data.cached || false);
        // 如果返回了模型信息，更新当前模型
        if (data.model) {
          setCurrentModel(data.model);
        }
      }
    } catch (error) {
      console.error('获取AI摘要失败:', error);
      setAiSummary('无法生成AI摘要，请稍后再试。错误: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // 初始加载摘要
  useEffect(() => {
    fetchAiSummary();
  }, [content, article.id]);

  // 点击刷新按钮的处理函数
  const handleRefreshSummary = () => {
    fetchAiSummary(true); // 传递 forceRefresh = true
  };

  // 切换模型的处理函数
  const handleModelChange = (modelId: string) => {
    if (modelId !== currentModel) {
      setCurrentModel(modelId);
      setShowModelDropdown(false);
      // 使用新模型重新生成摘要
      fetchAiSummary(true);
    }
  };

  if (!article) {
    // ... existing code ...
// ... existing code ...

      {/* 大模型摘要部分 */}
      <section className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">大模型摘要</h2>
          <div className="flex items-center space-x-2">
            {/* 模型选择下拉菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center hover:bg-gray-200"
              >
                {supportedModels[currentModel]?.name || '选择模型'}
                <FiChevronDown className="ml-1" />
              </button>
              
              {showModelDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <ul className="py-1">
                    {Object.entries(supportedModels).map(([modelId, modelInfo]) => (
                      <li key={modelId}>
                        <button
                          onClick={() => handleModelChange(modelId)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            modelId === currentModel ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div>{modelInfo.name}</div>
                          <div className="text-xs text-gray-500">{modelInfo.description}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {isCachedSummary && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">缓存</span>
            )}
            <button 
              onClick={handleRefreshSummary}
              disabled={isLoadingSummary}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full flex items-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`mr-1 ${isLoadingSummary ? 'animate-spin' : ''}`} />
              刷新摘要
            </button>
          </div>
        </div>
        {isLoadingSummary ? (
          <div className="flex items-center text-gray-500">
            <div className="w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mr-2"></div>
            <p>生成摘要中...</p>
          </div>
        ) : (
          <div className="prose">
            <p className="text-lg">{aiSummary || summary}</p>
          </div>
        )}
      </section>
// ... existing code ... 
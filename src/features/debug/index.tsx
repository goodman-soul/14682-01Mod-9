import React, { useEffect, useMemo, useState } from 'react';
import {
  Bug,
  RefreshCw,
  Trash2,
  Filter,
  Play,
  Pause,
  AlertCircle,
  Eye,
  MousePointerClick,
  FileText,
} from 'lucide-react';
import {
  TrackEvent,
  EventType,
  getEvents,
  clearEvents,
  getTenants,
  isTestMode,
  setTestMode,
  trackError,
  trackButtonClick,
  trackPageView,
} from '@/analytics';
import { currentConfig } from '@/configs';

const DebugAnalytics: React.FC = () => {
  const [events, setEvents] = useState<TrackEvent[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [filterTest, setFilterTest] = useState<string>('all');
  const [testEnabled, setTestEnabled] = useState<boolean>(isTestMode());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const tenants = useMemo(() => ['all', ...getTenants()], [events]);

  const refreshEvents = () => {
    setEvents(getEvents());
  };

  useEffect(() => {
    refreshEvents();
    if (!autoRefresh) return;
    const timer = setInterval(refreshEvents, 2000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedTenant !== 'all' && e.tenantId !== selectedTenant) return false;
      if (selectedType !== 'all' && e.type !== selectedType) return false;
      if (filterTest !== 'all' && String(e.isTest) !== filterTest) return false;
      return true;
    });
  }, [events, selectedTenant, selectedType, filterTest]);

  const handleClearEvents = () => {
    if (confirm('确定要清空所有埋点事件吗？')) {
      clearEvents();
      refreshEvents();
    }
  };

  const toggleTestMode = () => {
    const newValue = !testEnabled;
    setTestEnabled(newValue);
    setTestMode(newValue);
  };

  const triggerSampleEvent = (type: EventType) => {
    if (type === 'page_view') {
      trackPageView('/debug-demo', { demo: true });
    } else if (type === 'button_click') {
      trackButtonClick(null, 'demo_button_click', { demo: true });
    } else if (type === 'error') {
      trackError(new Error('这是一个示例错误用于调试'), { demo: true });
    }
    refreshEvents();
  };

  const getTypeIcon = (type: EventType) => {
    switch (type) {
      case 'page_view':
        return <Eye size={16} className="text-blue-500" />;
      case 'button_click':
        return <MousePointerClick size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  const getTypeName = (type: EventType) => {
    switch (type) {
      case 'page_view':
        return '页面访问';
      case 'button_click':
        return '按钮点击';
      case 'error':
        return '错误事件';
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  const stats = useMemo(() => {
    const total = events.length;
    const pageViews = events.filter((e) => e.type === 'page_view').length;
    const clicks = events.filter((e) => e.type === 'button_click').length;
    const errors = events.filter((e) => e.type === 'error').length;
    const testCount = events.filter((e) => e.isTest).length;
    return { total, pageViews, clicks, errors, testCount };
  }, [events]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <Bug size={28} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">埋点调试中心</h1>
          </div>
          <p className="text-gray-600 mt-1">
            当前租户：<span className="font-medium" style={{ color: currentConfig.theme.primaryColor }}>
              {currentConfig.name} ({currentConfig.id})
            </span>
            {' · '}
            版本：{currentConfig.id ? '开发版' : '正式版'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? <Play size={16} /> : <Pause size={16} />}
            {autoRefresh ? '自动刷新中' : '已暂停'}
          </button>
          <button
            onClick={refreshEvents}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw size={16} />
            刷新
          </button>
          <button
            onClick={handleClearEvents}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 size={16} />
            清空
          </button>
        </div>
      </div>

      {/* 测试模式开关 */}
      <div
        className={`rounded-lg border-2 p-4 ${
          testEnabled ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle size={18} className={testEnabled ? 'text-yellow-600' : 'text-gray-400'} />
              测试模式 {testEnabled && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">已启用</span>}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {testEnabled
                ? '当前为测试模式，所有埋点事件不会发送到正式服务器，仅本地保存。'
                : '当前为正式模式，事件会发送到服务器。开发测试前请开启测试模式。'}
            </p>
          </div>
          <button
            onClick={toggleTestMode}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              testEnabled
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-700 text-white hover:bg-gray-800'
            }`}
          >
            {testEnabled ? '关闭测试模式' : '开启测试模式'}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '总事件', value: stats.total, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: '页面访问', value: stats.pageViews, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '按钮点击', value: stats.clicks, icon: MousePointerClick, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '错误事件', value: stats.errors, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '测试事件', value: stats.testCount, icon: Bug, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${item.bg} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{item.label}</p>
                <Icon size={18} className={item.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* 触发示例事件 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-3">触发测试事件</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => triggerSampleEvent('page_view')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            触发页面访问
          </button>
          <button
            onClick={() => triggerSampleEvent('button_click')}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
          >
            触发按钮点击
          </button>
          <button
            onClick={() => triggerSampleEvent('error')}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            触发错误事件
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">筛选条件</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">租户</label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {tenants.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? '全部租户' : t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">事件类型</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部类型</option>
              <option value="page_view">页面访问</option>
              <option value="button_click">按钮点击</option>
              <option value="error">错误事件</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">数据类型</label>
            <select
              value={filterTest}
              onChange={(e) => setFilterTest(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              <option value="false">正式数据</option>
              <option value="true">测试数据</option>
            </select>
          </div>
        </div>
      </div>

      {/* 事件列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">事件列表 ({filteredEvents.length})</h3>
        </div>
        <div className="max-h-96 overflow-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bug size={40} className="mx-auto mb-3 text-gray-300" />
              <p>暂无事件数据，操作页面或点击上方触发按钮来生成事件</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredEvents.map((event) => (
                <div key={event.id}>
                  <div
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                    onClick={() =>
                      setExpandedEvent(expandedEvent === event.id ? null : event.id)
                    }
                  >
                    {getTypeIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{getTypeName(event.type)}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {event.tenantName}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          v{event.appVersion}
                        </span>
                        {event.isTest && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            测试
                          </span>
                        )}
                        {event.type === 'error' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            {event.errorType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {event.type === 'page_view' && (event.pageName || event.url)}
                        {event.type === 'button_click' && (event.elementText || event.buttonAction || '按钮点击')}
                        {event.type === 'error' && event.errorMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(event.timestamp)}</p>
                    </div>
                  </div>
                  {expandedEvent === event.id && (
                    <div className="px-4 pb-4 pt-0">
                      <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-auto max-h-64">
                        {JSON.stringify(event, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugAnalytics;

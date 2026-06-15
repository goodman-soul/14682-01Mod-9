import React, { lazy, Suspense } from 'react';
import { RouteObject, useRoutes, Navigate } from 'react-router-dom';
import { currentConfig, isFeatureEnabled } from '@/configs';
import { AuthGuard } from '@/components';
import {
  usePageViewTracking,
  useButtonClickTracking,
  useErrorTracking,
} from '@/analytics';

// 基础布局组件
const Layout = lazy(() => import('@/components/Layout'));

// 按需加载模块
const Dashboard = lazy(() => import('@/features/dashboard'));
const Reports = lazy(() => import('@/features/reports'));
const SocialFeed = lazy(() => import('@/features/social-feed'));
const Login = lazy(() => import('@/features/auth'));
const DebugAnalytics = lazy(() => import('@/features/debug'));

/**
 * 路由配置映射
 */
const moduleRoutes: Record<string, RouteObject> = {
  dashboard: {
    path: 'dashboard',
    element: <Dashboard />,
  },
  reports: {
    path: 'reports',
    element: <Reports />,
  },
  'social-feed': {
    path: 'social-feed',
    element: <SocialFeed />,
  },
};

export const AppRouter: React.FC = () => {
  usePageViewTracking();
  useButtonClickTracking();
  useErrorTracking();

  const dynamicRoutes = currentConfig.modules
    .map((moduleName) => moduleRoutes[moduleName])
    .filter(Boolean);

  const debugRoute = isFeatureEnabled('enableAnalytics')
    ? { path: 'debug', element: <DebugAnalytics /> }
    : null;

  const routes: RouteObject[] = [
    {
      path: '/login',
      element: (
        <Suspense fallback={<div>Loading Login...</div>}>
          <Login onLogin={(username, password) => {
            console.log('Login attempt:', username, password);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            window.location.href = '/';
          }} />
        </Suspense>
      ),
    },
    {
      path: '/',
      element: (
        <Suspense fallback={<div>Loading Layout...</div>}>
          <AuthGuard>
            <Layout />
          </AuthGuard>
        </Suspense>
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        ...dynamicRoutes,
        ...(debugRoute ? [debugRoute] : []),
        { path: '*', element: <Navigate to="dashboard" replace /> },
      ],
    },
  ];

  return useRoutes(routes);
};
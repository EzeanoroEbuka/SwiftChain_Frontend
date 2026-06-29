'use client';

import React from 'react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

// Simple shared wrapper to expose a breadcrumb component from shared folder
export const BreadcrumbNav: React.FC = () => {
  return <Breadcrumbs />;
};

export default BreadcrumbNav;

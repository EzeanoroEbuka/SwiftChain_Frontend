'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { breadcrumbService } from '@/services/breadcrumbService';

export interface Breadcrumb {
  label: string;
  href: string;
  isLast: boolean;
}

const formatSlug = (slug: string) => {
  return slug
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const isGuid = (slug: string) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(slug);
};

const isNumeric = (slug: string) => {
  return /^\d+$/.test(slug);
};

export const useBreadcrumbs = () => {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathSegments = pathname.split('/').filter((segment) => segment !== '');
      
      const breadcrumbList: Breadcrumb[] = [];
      let currentHref = '';

      // Add Home
      breadcrumbList.push({
        label: 'Home',
        href: '/',
        isLast: pathSegments.length === 0,
      });

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentHref += `/${segment}`;
        
        let label = formatSlug(segment);

        // Check if the segment is likely an ID (GUID or Numeric)
        if (isGuid(segment) || (isNumeric(segment) && i > 0)) {
          const parentSegment = pathSegments[i - 1];
          // Try to fetch a friendly name or mapped label for this resource
          label = await breadcrumbService.getLabelForChild(parentSegment, segment);
        }

        breadcrumbList.push({
          label,
          href: currentHref,
          isLast: i === pathSegments.length - 1,
        });
      }

      setBreadcrumbs(breadcrumbList);
    };

    generateBreadcrumbs();
  }, [pathname]);

  return breadcrumbs;
};

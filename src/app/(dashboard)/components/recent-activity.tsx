'use client';

import React from 'react';
import type { ActivityItem as ActivityItemType } from '@/types/dashboard';
import ActivityItem from './activity-item';

interface RecentActivityProps {
  activities: ActivityItemType[];
  isLoading: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, isLoading }) => {
  const activeTitleElements = React.useMemo(() => {
    return activities.map((activity: ActivityItemType) => (
      <ActivityItem
        key={activity.id}
        id={activity.id}
        description={activity.description}
        time={activity.time}
        details={activity.details}
      />
    ));
  }, [activities]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">暂无最近活动</p>
      </div>
    );
  }

  return <div className="space-y-2">{activeTitleElements}</div>;
};

export default RecentActivity;

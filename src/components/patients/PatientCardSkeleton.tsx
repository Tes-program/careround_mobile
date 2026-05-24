import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { radius } from '@/constants/theme';

export function PatientCardSkeleton() {
  return (
    <View
      className="bg-cr-surface border border-cr-line flex-row overflow-hidden"
      style={{ borderRadius: radius.lg, elevation: 1 }}
    >
      {/* Grey strip placeholder */}
      <View className="w-1.5 self-stretch bg-cr-line-strong rounded-l-xl" />

      {/* Card body */}
      <View className="flex-1 px-3 py-3 gap-2">
        {/* Row 1: Name + badge */}
        <View className="flex-row items-center justify-between">
          <Skeleton width="58%" height={14} borderRadius={4} />
          <Skeleton width="24%" height={20} borderRadius={10} />
        </View>

        {/* Row 2: Bed + vitals */}
        <View className="flex-row items-center gap-2">
          <Skeleton width="22%" height={12} borderRadius={4} />
          <Skeleton width="18%" height={12} borderRadius={4} />
        </View>

        {/* Row 3: Diagnosis */}
        <Skeleton width="78%" height={12} borderRadius={4} />

        {/* Row 4: Meta */}
        <Skeleton width="45%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

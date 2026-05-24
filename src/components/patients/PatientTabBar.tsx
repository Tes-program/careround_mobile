import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

export type PatientTab = 'overview' | 'notes' | 'medications' | 'vitals';

interface PatientTabBarProps {
  activeTab: PatientTab;
  onChange: (tab: PatientTab) => void;
}

const TABS: { key: PatientTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'notes', label: 'Notes' },
  { key: 'medications', label: 'Medications' },
  { key: 'vitals', label: 'Vitals' },
];

export function PatientTabBar({ activeTab, onChange }: PatientTabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      className="bg-cr-surface border-b border-cr-line"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`px-3 py-1.5 rounded-full ${
              isActive ? 'bg-cr-accent' : 'bg-transparent'
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              className={`text-sm font-sans-medium ${
                isActive ? 'text-white' : 'text-cr-muted'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { colors, radius, fontSize, fontFamily } from '@/constants/theme';
import type { HourlyDataPoint } from '@/hooks/useSupervisorDashboard';

interface HourlyChartProps {
  data: HourlyDataPoint[];
  currentHour: number;
}

interface TooltipState {
  visible: boolean;
  hour: number;
  count: number;
  x: number;
  y: number;
}

function getBarColor(hour: number, currentHour: number): string {
  if (hour < currentHour) return colors.accent;      // past — teal
  if (hour === currentHour) return '#0d9488';         // current — darker teal
  return '#d1faf6';                                   // future — light teal
}

export function HourlyChart({ data, currentHour }: HourlyChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const chartPadH = 16;
  const yAxisWidth = 28;
  const innerWidth = screenWidth - 32 - chartPadH * 2 - yAxisWidth;
  const barWidth = Math.max(4, Math.floor(innerWidth / 24) - 1);
  const chartHeight = 110;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    hour: 0,
    count: 0,
    x: 0,
    y: 0,
  });

  // Y-axis ticks (0, half, max)
  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.lg,
        padding: chartPadH,
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: fontSize.sm,
          fontFamily: fontFamily.sansSemiBold,
          color: colors.ink,
          marginBottom: 2,
        }}
      >
        Medications Administered Today
      </Text>
      <Text
        style={{
          fontSize: fontSize.xs,
          fontFamily: fontFamily.sans,
          color: colors.muted,
          marginBottom: 12,
        }}
      >
        by hour
      </Text>

      {/* Chart area */}
      <View style={{ flexDirection: 'row' }}>
        {/* Y axis */}
        <View
          style={{
            width: yAxisWidth,
            height: chartHeight + 18,
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingRight: 4,
            paddingBottom: 18,
          }}
        >
          {[...yTicks].reverse().map((tick) => (
            <Text
              key={tick}
              style={{
                fontSize: 9,
                fontFamily: fontFamily.sans,
                color: colors.muted,
              }}
            >
              {tick}
            </Text>
          ))}
        </View>

        {/* Bars + X axis */}
        <View style={{ flex: 1 }}>
          {/* Bar chart */}
          <View
            style={{
              height: chartHeight,
              flexDirection: 'row',
              alignItems: 'flex-end',
              borderLeftWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.line,
            }}
          >
            {data.map((point) => {
              const barH = Math.max(
                point.count > 0 ? 3 : 0,
                Math.round((point.count / maxCount) * (chartHeight - 4)),
              );
              return (
                <TouchableOpacity
                  key={point.hour}
                  activeOpacity={0.7}
                  onPress={() => {
                    setTooltip({
                      visible: true,
                      hour: point.hour,
                      count: point.count,
                      x: 0,
                      y: 0,
                    });
                  }}
                  style={{
                    flex: 1,
                    height: chartHeight,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  <View
                    style={{
                      width: Math.max(barWidth, 4),
                      height: barH,
                      backgroundColor: getBarColor(point.hour, currentHour),
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2,
                    }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* X axis labels — every 4 hours */}
          <View
            style={{
              flexDirection: 'row',
              height: 18,
              alignItems: 'center',
            }}
          >
            {data.map((point) => (
              <View key={point.hour} style={{ flex: 1, alignItems: 'center' }}>
                {point.hour % 4 === 0 ? (
                  <Text
                    style={{
                      fontSize: 8,
                      fontFamily: fontFamily.sans,
                      color: colors.muted,
                    }}
                  >
                    {point.label}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Tooltip modal */}
      <Modal
        transparent
        visible={tooltip.visible}
        animationType="fade"
        onRequestClose={() => setTooltip((s) => ({ ...s, visible: false }))}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setTooltip((s) => ({ ...s, visible: false }))}
        >
          <View
            style={{
              backgroundColor: colors.ink,
              borderRadius: radius.md,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fontFamily.sansSemiBold,
                color: colors.surface,
                textAlign: 'center',
                marginBottom: 2,
              }}
            >
              {String(tooltip.hour).padStart(2, '0')}:00
            </Text>
            <Text
              style={{
                fontSize: fontSize.xs,
                fontFamily: fontFamily.sans,
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              {tooltip.count} administered
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

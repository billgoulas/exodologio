import { View, Text, ScrollView } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { PieChartData } from '@/lib/charts-utils';
import { formatNumber } from '@/lib/utils-calc';
import { Language } from '@/lib/types';

interface PieChartProps {
  data: PieChartData[];
  title: string;
  language: Language;
}

export function PieChart({ data, title, language }: PieChartProps) {
  const size = 200;
  const radius = 80;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -Math.PI / 2;
  const slices = data.map((item, index) => {
    const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
      'Z',
    ].join(' ');

    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.65;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    currentAngle = endAngle;

    return {
      path: pathData,
      color: item.color,
      labelX,
      labelY,
      percentage: item.percentage.toFixed(1),
      item,
    };
  });

  return (
    <ScrollView className="flex-1">
      <View className="items-center py-4">
        <Text className="text-lg font-bold text-foreground mb-4">{title}</Text>

        {/* Pie Chart SVG */}
        {data.length > 0 ? (
          <View className="items-center mb-6">
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <G>
                {slices.map((slice, index) => (
                  <G key={index}>
                    <Circle
                      cx={slice.labelX}
                      cy={slice.labelY}
                      r="3"
                      fill={slice.color}
                    />
                  </G>
                ))}
              </G>
            </Svg>
          </View>
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">No data available</Text>
          </View>
        )}

        {/* Legend with Details */}
        <View className="w-full px-4">
          {data.map((item, index) => (
            <View key={index} className="mb-3 pb-3 border-b border-border">
              <View className="flex-row items-center mb-2">
                <View
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <Text className="text-base font-semibold text-foreground flex-1">
                  {item.icon} {item.label}
                </Text>
              </View>
              <View className="ml-6">
                <Text className="text-sm text-muted mb-1">
                  Amount: {formatNumber(item.amount, language)}
                </Text>
                <Text className="text-sm text-muted mb-1">
                  Percentage: {item.percentage.toFixed(2)}%
                </Text>
                <Text className="text-sm text-muted">
                  Transactions: {item.count}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

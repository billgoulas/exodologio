import { View, Text, ScrollView } from 'react-native';
import Svg, { Circle, G, Path, Ellipse, Defs, LinearGradient, Stop, Text as SvgText, TSpan } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { PieChartData } from '@/lib/charts-utils';
import { formatNumber, formatPercentage } from '@/lib/utils-calc';
import { Language } from '@/lib/types';
import { translations } from '@/lib/translations';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface PieChartProps {
  data: PieChartData[];
  title: string;
  language: Language;
  currency?: string;
}

export function PieChart({ data, title, language, currency = '€' }: PieChartProps) {
  const t = (key: string, defaultValue: string = key) => {
    const keys = key.split('.');
    let value: any = translations[language] || {};
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    return typeof value === 'string' ? value : defaultValue;
  };

  const size = 400;
  const svgHeight = size + 60;

  // Pinch to zoom, then drag with two fingers to pan around once zoomed
  // in (the edges of the enlarged chart go off the visible area
  // otherwise, since zoom is centered). Panning requires two fingers
  // (.minPointers(2)) specifically so a normal one-finger touch still
  // falls through to the page's vertical ScrollView instead of being
  // captured here.
  const zoom = useSharedValue(1);
  const savedZoom = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      zoom.value = Math.min(Math.max(savedZoom.value * e.scale, MIN_ZOOM), MAX_ZOOM);
    })
    .onEnd(() => {
      savedZoom.value = zoom.value;
      if (zoom.value <= MIN_ZOOM) {
        // Fully zoomed out — snap back to centered so the next zoom-in
        // starts fresh instead of off to one side.
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      // At zoom z, the content overflows by (z-1) * half the original
      // size on each side — clamp panning to that so you can't drag the
      // chart entirely off-screen.
      const maxPanX = (zoom.value - 1) * (size / 2);
      const maxPanY = (zoom.value - 1) * (svgHeight / 2);
      translateX.value = Math.min(Math.max(savedTranslateX.value + e.translationX, -maxPanX), maxPanX);
      translateY.value = Math.min(Math.max(savedTranslateY.value + e.translationY, -maxPanY), maxPanY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: zoom.value },
    ],
  }));

  const radius = 100;
  const centerX = size / 2;
  const centerY = size / 2 - 20;
  const depth = 30; // 3D depth

  let currentAngle = -Math.PI / 2;
  const slices = data.map((item, index) => {
    const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    // 3D effect - bottom shadow
    const startX3D = startX;
    const startY3D = startY + depth;
    const endX3D = endX;
    const endY3D = endY + depth;

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    // Main slice path (top)
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
      'Z',
    ].join(' ');

    // Side path for 3D effect
    const sidePath = [
      `M ${startX} ${startY}`,
      `L ${startX3D} ${startY3D}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${endX3D} ${endY3D}`,
      `L ${endX} ${endY}`,
      'Z',
    ].join(' ');

    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.65;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    currentAngle = endAngle;

    return {
      path: pathData,
      sidePath,
      color: item.color,
      labelX,
      labelY,
      percentage: formatPercentage(item.percentage, language),
      item,
      index,
    };
  });

  return (
    <ScrollView className="flex-1">
      <View className="flex-1 items-center py-4">
        <Text className="text-lg font-bold text-foreground mb-4">{title}</Text>

        {/* Pie Chart SVG with 3D Effect — pinch to zoom in/out */}
        {data.length > 0 ? (
          <View className="flex-1 items-center justify-center mb-6" style={{ overflow: 'visible' }}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={zoomStyle}>
                <Svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`}>
                  <Defs>
                <LinearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
                </LinearGradient>
              </Defs>

              {/* 3D Base (shadow) */}
              <Ellipse
                cx={centerX}
                cy={centerY + depth + 10}
                rx={radius}
                ry={radius * 0.3}
                fill="#000000"
                opacity="0.15"
              />

              {/* Side faces for 3D effect */}
              {slices.map((slice, index) => (
                <Path
                  key={`side-${index}`}
                  d={slice.sidePath}
                  fill={slice.color}
                  opacity="0.6"
                />
              ))}

              {/* Top slices */}
              {slices.map((slice, index) => (
                <G key={`top-${index}`}>
                  <Path
                    d={slice.path}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </G>
              ))}

              {/* Percentage labels on slices */}
              {slices.map((slice, index) => (
                <SvgText
                  key={`label-${index}`}
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#ffffff"
                  opacity="0.9"
                >
                  <TSpan>{slice.percentage}</TSpan>
                </SvgText>
              ))}
            </Svg>
            </Animated.View>
          </GestureDetector>
          </View>
        ) : (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">{t('analytics.noData')}</Text>
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
                  {item.icon} {t(`categories.${item.category}`, item.label)}
                </Text>
              </View>
              <View className="ml-6">
                <Text className="text-sm text-muted mb-1">
                  {t('analytics.chartAmount')}: {formatNumber(item.amount, language)} {currency}
                </Text>
                <Text className="text-sm text-muted mb-1">
                  {t('analytics.chartPercentage')}: {formatPercentage(item.percentage, language)}
                </Text>
                <Text className="text-sm text-muted">
                  {t('analytics.chartTransactions')}: {item.count}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

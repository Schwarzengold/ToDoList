// components/ProgressBar.js
import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

const ProgressBar = ({ progress /* число от 0 до 1 */ }) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(progress, { duration: 400 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
      backgroundColor: interpolateColor(
        progressValue.value,
        [0, 0.25, 0.5, 0.75, 1],
        ['#8C2922', '#F44336', '#FFEB3B', '#A2FF45', '#4CAF50']
      ),
    };
  });

  // текст в процентах
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, barStyle]} />
      <View style={styles.labelWrapper}>
        <Text style={[styles.label, percent !== 100 ? styles.labelDark : styles.labelLight]}>
          {percent}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 22,
    width: '95%',
    backgroundColor: '#EEE',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: 75,
  },
  bar: {
    height: '100%',
  },
  labelWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelDark: {
    color: '#333',
    textShadowColor: '#000000',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 1
  },
  labelLight: {
    color: '#fff',
    textShadowColor: '#000000',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 3
    

  },
});

export default ProgressBar;

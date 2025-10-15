const pulse = useRef(new Animated.Value(0)).current;
useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]),
    { iterations: 2 }
  ).start();
}, []);

const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.2] });

<Animated.View style={{
  position: "absolute",
  width: 28, height: 28, borderRadius: 14,
  backgroundColor: "#72C55D",
  transform: [{ scale }],
  opacity,
}}/>

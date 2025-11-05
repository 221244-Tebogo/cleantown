import React from "react";
import { Platform } from "react-native";

type Props = {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
};

let LottieImpl: React.ComponentType<Props>;

if (Platform.OS === "web") {
  const { default: Lottie } = require("lottie-react");
  LottieImpl = ({ source, autoPlay = true, loop = true, style }) => (
    <Lottie animationData={source} autoplay={autoPlay} loop={loop} style={style} />
  );
} else {
  const { default: LottieNative } = require("lottie-react-native");
  LottieImpl = ({ source, autoPlay = true, loop = true, style }) => (
    <LottieNative source={source} autoPlay={autoPlay} loop={loop} style={style} />
  );
}

export default function LottieViewWrapper(props: Props) {
  return <LottieImpl {...props} />;
}

import { LinearGradient as ExpoLinearGradient, LinearGradientProps } from "expo-linear-gradient";
import React from "react";


type Props = LinearGradientProps & { className?: string };

export const LinearGradient = React.forwardRef<any, Props>(({ className, ...props }, ref) => {
  return <ExpoLinearGradient ref={ref} {...props} />;
});
LinearGradient.displayName = "LinearGradient";

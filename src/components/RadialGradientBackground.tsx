// components/RadialGradientBackground.tsx
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '@/theme';

interface RadialGradientBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export const RadialGradientBackground = ({ children, style }: RadialGradientBackgroundProps) => {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]} // #D3F3F0 to #BBE2F1
      style={[{ flex: 1 }, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};

// import React from 'react';
// import RadialGradient from 'react-native-radial-gradient';
// import { colors } from '@/theme';

// interface RadialGradientBackgroundProps {
//   children: React.ReactNode;
//   style?: any;
// }

// export const RadialGradientBackground = ({ children, style }: RadialGradientBackgroundProps) => {
//   return (
//     <RadialGradient
//       style={[{ flex: 1 }, style]}
//       colors={[colors.gradientStart, colors.gradientEnd]}
//       stops={[0, 1]}
//       center={[0, 0]}
//       radius={800}
//     >
//       {children}
//     </RadialGradient>
//   );
// };
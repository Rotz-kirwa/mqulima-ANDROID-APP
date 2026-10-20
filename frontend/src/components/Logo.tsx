import React from "react";
import Svg, { Path, Circle } from "react-native-svg";

export function Logo({ size = 40 }: { size?: number }) {
  const dark = "#2D6A2F";
  const light = "#4CAF50";
  return (
    <Svg width={size} height={size} viewBox="10 2.5 105 105" fill="none">
      <Path d="M 50 95 V 15" stroke="#1B5E20" strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M 50 90 C 35 90, 26 80, 25 65 C 35 67, 46 76, 50 90 Z" fill={dark} />
      <Path d="M 50 72 C 35 72, 26 62, 25 47 C 35 49, 46 58, 50 72 Z" fill={dark} />
      <Path d="M 50 54 C 35 54, 26 44, 25 29 C 35 31, 46 40, 50 54 Z" fill={dark} />
      <Path d="M 50 36 C 37 36, 30 28, 28 15 C 36 17, 46 25, 50 36 Z" fill={dark} />
      <Path d="M 50 90 C 65 90, 74 80, 75 65 C 65 67, 54 76, 50 90 Z" fill={light} />
      <Path d="M 50 72 C 65 72, 74 62, 75 47 C 65 49, 54 58, 50 72 Z" fill={light} />
      <Path d="M 50 54 C 65 54, 74 44, 75 29 C 65 31, 54 40, 50 54 Z" fill={light} />
      <Path d="M 50 36 C 63 36, 70 28, 72 15 C 64 17, 54 25, 50 36 Z" fill={light} />
      <Path d="M 72 68 L 84 62 H 93" stroke="#EAB308" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={93} cy={62} r={3.5} fill="#EAB308" />
      <Path d="M 73 50 L 86 44 H 96" stroke="#84CC16" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={96} cy={44} r={3.5} fill="#84CC16" />
      <Path d="M 72 32 L 83 25 H 90" stroke="#EAB308" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={90} cy={25} r={3.5} fill="#EAB308" />
    </Svg>
  );
}

export function AiLogo({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path d="M 22 34 H 65 C 72.7 34 79 40.3 79 48 V 58 C 79 65.7 72.7 72 65 72 H 38 L 22 86 L 27 72 H 22 C 14.3 72 8 65.7 8 58 V 48 C 8 40.3 14.3 34 22 34 Z" fill="#3B66C4" />
      <Path d="M 44 14 H 78 C 85.7 14 92 20.3 92 28 V 44 C 92 51.7 85.7 58 78 58 H 63 L 53 71 L 56 58 H 44 C 36.3 58 30 51.7 30 44 V 28 C 30 20.3 36.3 14 44 14 Z" fill="#F5C542" />
    </Svg>
  );
}

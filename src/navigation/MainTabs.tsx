import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, Platform, Text } from 'react-native';

import MapShare from '@/screens/MapShare';
import ReportModal from '@/screens/Report';
import Leaderboard from '@/screens/Leaderboard';
import CleanupScheduler from '@/screens/CleanupScheduler';
import Profile from '@/screens/Profile';

import { colors, fonts } from '@/theme';
import { playSound, BUTTON_PRESS_SOUND } from '@/services/sound';

export type TabParamList = {
  MapShare: undefined;
  Report: undefined;
  Leaderboard: undefined;
  Profile: undefined;
  Schedule: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <Image
    source={source}
    style={{
      width: 30,
      height: 30,
      opacity: focused ? 1 : 0.75,
      transform: [{ scale: focused ? 1.05 : 1 }],
      resizeMode: 'contain',
    }}
  />
);

export default function MainTabs() {
  const handleTabPress = () => {
    playSound(BUTTON_PRESS_SOUND);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: colors.navIcons,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: Platform.OS === 'ios' ? 74 : 64,
          paddingBottom: Platform.OS === 'ios' ? 10 : 6,
          paddingTop: Platform.OS === 'ios' ? 6 : 4,
          backgroundColor: colors.navBackground,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={{
              fontSize: 11,
              marginTop: 2,
              fontFamily: focused ? fonts.bodyBold : fonts.body,
              color: focused ? '#FFFFFF' : colors.navIcons,
            }}
            numberOfLines={1}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tab.Screen
        name="MapShare"
        component={MapShare}
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/maps-icon.png')}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            handleTabPress();
          },
        }}
      />

      <Tab.Screen
        name="Report"
        component={ReportModal}
        options={{
          title: 'Report',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/report-icon.png')}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            handleTabPress();
          },
        }}
      />

      <Tab.Screen
        name="Leaderboard"
        component={Leaderboard}
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/leaderboard-icon.png')}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            handleTabPress();
          },
        }}
      />

      <Tab.Screen
        name="Schedule"
        component={CleanupScheduler}
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/cleantown-recycling.png')}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            handleTabPress();
          },
        }}
      />

      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/profile-icon.png')}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            handleTabPress();
          },
        }}
      />
    </Tab.Navigator>
  );
}

import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import TeacherHome from './src/screens/teacher/TeacherHome';
import StartSession from './src/screens/teacher/StartSession';
import TeacherReports from './src/screens/teacher/TeacherReports';
import StudentHome from './src/screens/student/StudentHome';
import AttendanceStatus from './src/screens/student/AttendanceStatus';
import StudentHistory from './src/screens/student/StudentHistory';

const Stack = createNativeStackNavigator();
const TeacherTab = createBottomTabNavigator();
const StudentTab = createBottomTabNavigator();

const IndigoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4338CA',
    background: '#F5F3FF',
    card: '#FFFFFF',
    text: '#1E1B4B',
    border: '#E0E7FF',
    notification: '#EF4444',
  },
};

function TeacherTabs() {
  return (
    <TeacherTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4338CA',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTintColor: '#FFFFFF',
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <TeacherTab.Screen
        name="Home"
        component={TeacherHome}
        options={{ title: 'Home', tabBarLabel: 'Home' }}
      />
      <TeacherTab.Screen
        name="Sessions"
        component={StartSession}
        options={{ title: 'Sessions', tabBarLabel: 'Sessions' }}
      />
      <TeacherTab.Screen
        name="Reports"
        component={TeacherReports}
        options={{ title: 'Reports', tabBarLabel: 'Reports' }}
      />
    </TeacherTab.Navigator>
  );
}

function StudentTabs() {
  return (
    <StudentTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4338CA',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTintColor: '#FFFFFF',
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <StudentTab.Screen
        name="Home"
        component={StudentHome}
        options={{ title: 'Home', tabBarLabel: 'Home' }}
      />
      <StudentTab.Screen
        name="Attendance"
        component={AttendanceStatus}
        options={{ title: 'Attendance', tabBarLabel: 'Attendance' }}
      />
      <StudentTab.Screen
        name="History"
        component={StudentHistory}
        options={{ title: 'History', tabBarLabel: 'History' }}
      />
    </StudentTab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user?.role === 'teacher' ? (
        <Stack.Screen name="TeacherRoot" component={TeacherTabs} />
      ) : (
        <Stack.Screen name="StudentRoot" component={StudentTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={IndigoTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#4338CA',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 18,
  },
});

import React, { useState, useEffect } from 'react'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

import AuthScreen from './screens/AuthScreen'
import DashboardScreen from './screens/DashboardScreen'
import HistoryScreen from './screens/HistoryScreen'
import AddTransactionScreen from './screens/AddTransactionScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import PortfolioScreen from './screens/PortfolioScreen'
import AdvisorScreen from './screens/AdvisorScreen'
import GoalsScreen from './screens/GoalsScreen'

const Tab = createBottomTabNavigator()

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#080A09',
      card: 'rgba(8,10,9,0.95)',
      text: '#f1f5f9',
      border: 'rgba(255,255,255,0.08)',
      primary: '#D9FF5B',
    },
  }

  return (
    <>
      <StatusBar style="light" />
      {!session ? (
        <AuthScreen />
      ) : (
        <NavigationContainer theme={navTheme}>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#D9FF5B',
              tabBarInactiveTintColor: '#94a3b8',
              tabBarStyle: {
                backgroundColor: 'rgba(8,10,9,0.95)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.08)',
                paddingBottom: 8,
                paddingTop: 8,
                height: 62,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              },
              tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            }}
          >
            <Tab.Screen 
              name="Home" 
              children={(props) => <DashboardScreen {...props} session={session} />} 
              options={{
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons name={focused ? "grid" : "grid-outline"} size={size - 2} color={color} />
                ),
                tabBarLabel: 'Home'
              }}
            />
            <Tab.Screen 
              name="Advisor" 
              children={(props) => <AdvisorScreen {...props} session={session} />} 
              options={{
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={size - 2} color={color} />
                ),
                tabBarLabel: 'AI Coach'
              }}
            />
            <Tab.Screen 
              name="Add" 
              children={(props) => <AddTransactionScreen {...props} session={session} />}
              options={{
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={size + 2} color="#D9FF5B" />
                ),
                tabBarLabel: 'Add'
              }}
            />
            <Tab.Screen 
              name="Goals" 
              children={(props) => <GoalsScreen {...props} session={session} />}
              options={{
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons name={focused ? "trophy" : "trophy-outline"} size={size - 2} color={color} />
                ),
                tabBarLabel: 'Vault'
              }}
            />
            <Tab.Screen 
              name="Analytics" 
              children={(props) => <AnalyticsScreen {...props} session={session} />}
              options={{
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={size - 2} color={color} />
                ),
                tabBarLabel: 'Stats'
              }}
            />
            <Tab.Screen 
              name="Portfolio" 
              children={(props) => <PortfolioScreen {...props} session={session} />}
              options={{
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons name={focused ? "wallet" : "wallet-outline"} size={size - 2} color={color} />
                ),
                tabBarLabel: 'Assets'
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      )}
    </>
  )
}

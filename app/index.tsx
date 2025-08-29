import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { db, getCurrentUserUID, onAuthStateChanged, ensureAuthenticated } from '@/services/firebase';
import OnboardingScreen from '@/components/OnboardingScreen';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Ensure user is authenticated
        const uid = await ensureAuthenticated();
        
        // Check if user has completed onboarding
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
          // User has completed onboarding, navigate to tabs
          router.replace('/(tabs)/friends');
        } else {
          // User needs to complete onboarding
          setNeedsOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setNeedsOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (needsOnboarding) {
    return <OnboardingScreen />;
  }

  // This should not be reached as we navigate away
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
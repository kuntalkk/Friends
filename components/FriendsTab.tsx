import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Users } from 'lucide-react-native';
import { db, getCurrentUserUID, onAuthStateChanged } from '@/services/firebase';
import { User } from '@/types';

export default function FriendsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged((user) => {
      setCurrentUserUID(user ? user.uid : null);
    });

    // Set initial current user
    setCurrentUserUID(getCurrentUserUID());

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all users from Firestore
        const usersSnapshot = await db.collection('users').get();
        
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          const userData = doc.data() as User;
          usersList.push(userData);
        });

        // Sort users alphabetically by name
        usersList.sort((a, b) => a.name.localeCompare(b.name));
        
        setUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load friends');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const renderUserItem = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUserUID;
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            isCurrentUser && styles.currentUserName
          ]}>
            {item.name}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.userDob}>
            Born: {new Date(item.dob).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Users size={24} color="#6366f1" />
          <Text style={styles.title}>FRIENDS</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Users size={24} color="#6366f1" />
          <Text style={styles.title}>FRIENDS</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={24} color="#6366f1" />
        <Text style={styles.title}>FRIENDS</Text>
      </View>
      
      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No friends found</Text>
          <Text style={styles.emptySubtext}>
            Be the first to join by completing your profile!
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 12,
    letterSpacing: 1,
  },
  listContainer: {
    paddingBottom: 16,
  },
  userItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  currentUserName: {
    color: '#6366f1',
    fontWeight: '700',
  },
  userDob: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
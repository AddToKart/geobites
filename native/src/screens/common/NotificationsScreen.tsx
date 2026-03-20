import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getNotifications,
  markNotificationAsRead,
} from '../../services/notificationService';
import { Notification } from '../../types';
import { Colors } from '../../utils/colors';

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    const response = await getNotifications({ page: 1, limit: 50 });
    setNotifications(response.data);
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    await loadNotifications();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        contentContainerStyle={styles.list}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, item.isRead ? styles.readCard : styles.unreadCard]}
            onPress={() => void markAsRead(item.id)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: Colors.bgPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  list: {
    gap: 10,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  readCard: {
    borderColor: Colors.borderColor,
    backgroundColor: Colors.bgCard,
  },
  unreadCard: {
    borderColor: Colors.primary,
    backgroundColor: '#FDEAD9',
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  cardMessage: {
    marginTop: 4,
    color: Colors.textSecondary,
  },
});

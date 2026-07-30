import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MusicLink } from '../types';

interface MusicLinksQuickAccessProps {
  musicLinks: MusicLink[];
}

export const MusicLinksQuickAccess: React.FC<MusicLinksQuickAccessProps> = ({ musicLinks }) => {
  const handleOpenLink = async (url: string, name: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert("Can't open this URL");
        } else {
          Alert.alert('Error', "Can't open this URL");
        }
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const getIconName = (type: MusicLink['type']): string => {
    switch (type) {
      case 'spotify':
        return 'logo-spotify';
      case 'youtube':
        return 'logo-youtube';
      default:
        return 'musical-note';
    }
  };

  if (musicLinks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="headset" size={18} color="#e94560" />
        <Text style={styles.title}>Quick Music</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {musicLinks.map(link => (
          <TouchableOpacity
            key={link.id}
            style={styles.linkCard}
            onPress={() => handleOpenLink(link.url, link.name)}
          >
            <Ionicons name={getIconName(link.type) as any} size={24} color="#e94560" />
            <Text style={styles.linkName} numberOfLines={1}>{link.name}</Text>
            <Ionicons name="open-outline" size={14} color="#8b8b8b" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  linkCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    minWidth: 140,
    maxWidth: 180,
  },
  linkName: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
});

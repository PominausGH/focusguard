import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MusicLink } from '../types';

interface MusicLinksManagerProps {
  musicLinks: MusicLink[];
  onUpdate: (links: MusicLink[]) => void;
}

export const MusicLinksManager: React.FC<MusicLinksManagerProps> = ({ musicLinks, onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const detectLinkType = (url: string): 'spotify' | 'youtube' | 'other' => {
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return 'other';
  };

  const handleAddLink = () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Please enter both name and URL');
      } else {
        Alert.alert('Error', 'Please enter both name and URL');
      }
      return;
    }

    const newLink: MusicLink = {
      id: Date.now().toString(),
      name: newLinkName.trim(),
      url: newLinkUrl.trim(),
      type: detectLinkType(newLinkUrl),
    };

    onUpdate([...musicLinks, newLink]);
    setNewLinkName('');
    setNewLinkUrl('');
    setShowAddForm(false);
  };

  const handleDeleteLink = (id: string) => {
    onUpdate(musicLinks.filter(link => link.id !== id));
  };

  const handleOpenLink = async (url: string) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="musical-notes" size={20} color="#e94560" />
          <Text style={styles.title}>Music Links</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name={showAddForm ? 'close' : 'add'} size={20} color="#e94560" />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Link name (e.g., Focus Playlist)"
            placeholderTextColor="#8b8b8b"
            value={newLinkName}
            onChangeText={setNewLinkName}
          />
          <TextInput
            style={styles.input}
            placeholder="URL (Spotify, YouTube, etc.)"
            placeholderTextColor="#8b8b8b"
            value={newLinkUrl}
            onChangeText={setNewLinkUrl}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleAddLink}>
            <Text style={styles.saveButtonText}>Add Link</Text>
          </TouchableOpacity>
        </View>
      )}

      {musicLinks.length > 0 ? (
        <View style={styles.linksList}>
          {musicLinks.map(link => (
            <View key={link.id} style={styles.linkCard}>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => handleOpenLink(link.url)}
              >
                <Ionicons name={getIconName(link.type) as any} size={24} color="#e94560" />
                <Text style={styles.linkName} numberOfLines={1}>{link.name}</Text>
                <Ionicons name="open-outline" size={16} color="#8b8b8b" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteLink(link.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#8b8b8b" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        !showAddForm && (
          <Text style={styles.emptyText}>
            Add music links for quick access during focus sessions
          </Text>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  addForm: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linksList: {
    gap: 8,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  linkName: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  deleteButton: {
    padding: 16,
  },
  emptyText: {
    fontSize: 12,
    color: '#8b8b8b',
    textAlign: 'center',
    padding: 16,
  },
});

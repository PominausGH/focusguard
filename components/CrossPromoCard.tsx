import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { CrossPromoOffer } from '../services/crossPromo';

interface CrossPromoCardProps {
  offer: CrossPromoOffer;
  onOpen: () => void;
  onDismiss: () => void;
}

export const CrossPromoCard: React.FC<CrossPromoCardProps> = ({ offer, onOpen, onDismiss }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
    >
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
        Also from Dainty Trading
      </Text>
      <Text style={[styles.headline, { color: colors.text }]}>{offer.headline}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{offer.body}</Text>

      <TouchableOpacity style={[styles.cta, { borderColor: colors.primary }]} onPress={onOpen}>
        <Text style={[styles.ctaText, { color: colors.primary }]}>{offer.ctaLabel}</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    width: 300,
    maxWidth: '100%',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  headline: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    paddingRight: 20,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

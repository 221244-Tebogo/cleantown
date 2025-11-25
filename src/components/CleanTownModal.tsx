import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { colors, spacing, radius, shadows, textStyles, fonts } from '@/theme';

interface CleanTownModalProps {
  title?: string;
  subtitle?: string;
  icon?: ImageSourcePropType;
  children?: ReactNode; 
  onClose?: () => void;
  showCloseTextButton?: boolean; 
  showCloseIcon?: boolean; 
}

export function CleanTownModal({
  title,
  subtitle,
  icon,
  children,
  onClose,
  showCloseTextButton = false,
  showCloseIcon = true,
}: CleanTownModalProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {showCloseIcon && onClose && (
          <Pressable style={styles.closeIconButton} onPress={onClose}>
            <Text style={styles.closeIconText}>×</Text>
          </Pressable>
        )}

        {icon && <Image source={icon} style={styles.icon} />}

        {title && <Text style={styles.title}>{title}</Text>}

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {children}

        {showCloseTextButton && onClose && (
          <Pressable onPress={onClose} style={styles.closeTextButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface ModalButtonProps {
  label: string;
  onPress: () => void;
}

export function ModalPrimaryButton({ label, onPress }: ModalButtonProps) {
  return (
    <Pressable style={styles.modalButtonPrimary} onPress={onPress}>
      <Text style={styles.modalButtonPrimaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: spacing(3),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3),
    ...shadows.lg,
  },

  closeIconButton: {
    position: 'absolute',
    top: spacing(1.5),
    right: spacing(1.5),
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD8B9',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  closeIconText: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: '#FC7A12',
    lineHeight: 20,
  },

  icon: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: spacing(1.5),
  },
  title: {
    fontFamily: 'CherryBomb-One',
    fontSize: 24,
    color: '#2A7390',
    textAlign: 'center',
    marginBottom: spacing(0.75),
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing(2),
  },

  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0E8D8',
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    marginTop: spacing(1.5),
  },
  pointsLabel: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginRight: spacing(1),
  },
  pointsValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.primaryDark,
  },

  closeTextButton: {
    marginTop: spacing(2),
    paddingVertical: spacing(1),
    alignItems: 'center',
  },
  closeText: {
    ...textStyles.bodySmall,
    color: colors.muted,
  },

  modalButtonPrimary: {
    marginTop: spacing(2),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(3),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  modalButtonPrimaryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#1C2530',
  },
});

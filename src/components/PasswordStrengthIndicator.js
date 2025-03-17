import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useLocalization from '../hooks/useLocalization';

/**
 * Password strength indicator component
 * Visually displays password strength with a multi-segment bar and feedback text
 * 
 * @param {Object} props
 * @param {string} props.password - Current password to evaluate
 * @param {boolean} props.compact - Whether to use compact layout
 */
export default function PasswordStrengthIndicator({ password, compact = false }) {
  const { safeT, getTextAlignStyle } = useLocalization();
  
  // Calculate password strength
  const getStrength = (pass) => {
    if (!pass) return 0;
    
    let score = 0;
    
    // Length check
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    // Normalize to 0-4 scale
    return Math.min(4, Math.floor(score / 1.5));
  };
  
  const strength = getStrength(password);
  
  // Get text and color based on strength
  const getStrengthInfo = (strength) => {
    switch (strength) {
      case 0:
        return { 
          text: safeT('auth.passwordStrength.veryWeak'), 
          color: '#EF4444',  // Red
          segments: 1
        };
      case 1:
        return { 
          text: safeT('auth.passwordStrength.weak'), 
          color: '#F97316',  // Orange
          segments: 2
        };
      case 2:
        return { 
          text: safeT('auth.passwordStrength.fair'), 
          color: '#FBBF24',  // Amber
          segments: 3
        };
      case 3:
        return { 
          text: safeT('auth.passwordStrength.good'), 
          color: '#34D399',  // Emerald
          segments: 4
        };
      case 4:
        return { 
          text: safeT('auth.passwordStrength.strong'), 
          color: '#10B981',  // Green
          segments: 5
        };
      default:
        return { 
          text: safeT('auth.passwordStrength.veryWeak'), 
          color: '#EF4444',
          segments: 1
        };
    }
  };
  
  const { text, color, segments } = getStrengthInfo(strength);
  
  if (!password) return null;
  
  return (
    <View style={[
      styles.container,
      compact && styles.compactContainer
    ]}>
      <View style={[
        styles.segmentsContainer,
        compact && styles.compactSegmentsContainer
      ]}>
        {Array(5).fill(0).map((_, i) => (
          <View 
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < segments ? color : '#E2E8F0' },
              compact && styles.compactSegment,
              i < 4 && styles.segmentWithMargin
            ]}
          />
        ))}
      </View>
      
      <Text style={[
        styles.strengthText,
        { color },
        getTextAlignStyle(),
        compact && styles.compactText
      ]}>
        {text}
      </Text>
      
      {!compact && strength < 3 && (
        <Text style={[styles.strengthHint, getTextAlignStyle()]}>
          {safeT('auth.passwordStrength.hint')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  compactContainer: {
    marginVertical: 4,
  },
  segmentsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  compactSegmentsContainer: {
    marginBottom: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  compactSegment: {
    height: 4,
  },
  segmentWithMargin: {
    marginRight: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  compactText: {
    fontSize: 12,
  },
  strengthHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  }
});
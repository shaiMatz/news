import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Banner component to encourage users to sign up for premium features
 * 
 * @param {Object} props
 * @param {number} props.freeLimit - Number of free items (default: 10)
 * @param {Function} props.onClose - Called when the user dismisses the banner
 * @param {string} props.variant - Banner style variant ("compact", "standard", "prominent")
 */
export default function PremiumBanner({ 
  freeLimit = 10, 
  onClose,
  variant = "standard"
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  const handleSignUpPress = () => {
    navigation.navigate('Auth');
  };
  
  const handleLearnMore = () => {
    setShowDetails(!showDetails);
  };

  // Determine background color based on theme
  const bannerBackground = theme.isDark 
    ? 'rgba(37, 99, 235, 0.2)' 
    : '#EFF6FF';
  
  // For compact display
  if (variant === "compact") {
    return (
      <View style={[
        styles.compactContainer,
        { 
          backgroundColor: bannerBackground,
          borderColor: theme.border
        }
      ]}>
        <Feather name="info" size={16} color={theme.primary} style={styles.compactIcon} />
        <Text style={[styles.compactText, { color: theme.text }]}>
          First {freeLimit} news items are free
        </Text>
        <TouchableOpacity 
          style={[styles.compactButton, { backgroundColor: theme.primary }]}
          onPress={handleSignUpPress}
        >
          <Text style={styles.compactButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // For prominent display with features list
  if (variant === "prominent") {
    return (
      <View style={[
        styles.prominentContainer,
        { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.isDark ? theme.primary + '40' : theme.primary + '20',
        }
      ]}>
        <View style={styles.prominentHeader}>
          <View style={styles.prominentIconContainer}>
            <Feather name="unlock" size={24} color={theme.primary} />
          </View>
          <View style={styles.prominentTextContainer}>
            <Text style={[styles.prominentTitle, { color: theme.text }]}>
              Unlock All Features
            </Text>
            <Text style={[styles.prominentSubtitle, { color: theme.textSecondary }]}>
              Sign in for free to access unlimited news and all features
            </Text>
          </View>
        </View>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <Feather name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              Unlimited news access (not just {freeLimit} items)
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Feather name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              Upload and share news content
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Feather name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              Like and comment on news
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Feather name="check-circle" size={16} color={theme.success} />
            <Text style={[styles.featureText, { color: theme.text }]}>
              Personalized notifications
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.prominentButton, { backgroundColor: theme.primary }]}
          onPress={handleSignUpPress}
        >
          <Text style={styles.prominentButtonText}>Sign In</Text>
          <Feather name="log-in" size={18} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
        
        {onClose && (
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Feather name="x" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Standard display (default)
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: bannerBackground,
        shadowColor: theme.shadow
      }
    ]}>
      <View style={styles.iconContainer}>
        <Feather name="info" size={24} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.title,
          { color: theme.isDark ? theme.primary : '#1E40AF' }
        ]}>
          Viewing Limited Content ({freeLimit} Items)
        </Text>
        <Text style={[
          styles.message,
          { color: theme.isDark ? theme.textSecondary : '#3B82F6' }
        ]}>
          Sign in to unlock all news, sharing, and more.
          {showDetails ? (
            <>
              {"\n\n"}• Access unlimited news content
              {"\n"}• Like, share, and comment
              {"\n"}• Upload your own news
              {"\n"}• Get personalized alerts
            </>
          ) : null}
        </Text>
        
        <TouchableOpacity 
          style={styles.learnMoreButton}
          onPress={handleLearnMore}
        >
          <Text style={[styles.learnMoreText, { color: theme.primary }]}>
            {showDetails ? "Show less" : "Learn more"}
          </Text>
          <Feather 
            name={showDetails ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={theme.primary} 
            style={styles.learnMoreIcon}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleSignUpPress}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      
      {onClose && (
        <TouchableOpacity 
          style={styles.dismissButton} 
          onPress={onClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Feather name="x" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Standard Banner
  container: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
    fontSize: 14,
  },
  message: {
    color: '#3B82F6',
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  learnMoreText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  learnMoreIcon: {
    marginLeft: 4,
  },
  
  // Compact Banner
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: 'rgba(219, 234, 254, 0.5)',
  },
  compactIcon: {
    marginRight: 6,
  },
  compactText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
  },
  compactButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  compactButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  
  // Prominent Banner
  prominentContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  prominentHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  prominentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prominentTextContainer: {
    flex: 1,
  },
  prominentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prominentSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  featuresContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 13,
  },
  prominentButton: {
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prominentButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  }
});

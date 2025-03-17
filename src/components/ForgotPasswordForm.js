import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import useLocalization from '../hooks/useLocalization';
import ErrorMessage from './ErrorMessage';
import { isOnline } from '../utils/connectivityUtils';
import { ErrorTypes } from '../utils/errorUtils';

/**
 * Forgot password form component
 * 
 * @param {Object} props
 * @param {Function} props.onCancel - Function to handle cancellation
 * @param {Function} props.onSuccess - Function to handle successful password reset request
 * @param {Function} props.onSubmit - Function to submit the forgot password request
 */
export default function ForgotPasswordForm({ onCancel, onSuccess, onSubmit }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { safeT, getTextAlignStyle, getDirectionStyle, getFlowStyle } = useLocalization();

  // Handle form submission
  const handleSubmit = async () => {
    // Reset error state
    setError(null);
    
    // Simple email validation
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(safeT('auth.validEmailRequired'));
      return;
    }
    
    // Check for network connection
    const isConnected = await isOnline();
    if (!isConnected) {
      setError(safeT('connectivity.checkConnection'));
      return;
    }

    try {
      setLoading(true);
      // Call the provided submit handler
      const errorMessage = await onSubmit(email);
      
      // If there was an error, display it
      if (errorMessage) {
        setError(errorMessage);
        return;
      }
      
      // Otherwise, call the success handler
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || safeT('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{safeT('auth.forgotPassword')}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Feather name="x" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.description, getTextAlignStyle()]}>
          {safeT('auth.resetInstructions')}
        </Text>
        
        {error && (
          <ErrorMessage 
            message={error} 
            compact={true}
            showRetry={false}
          />
        )}
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, getTextAlignStyle()]}>{safeT('auth.email')}</Text>
          <View style={[styles.inputContainer, getDirectionStyle()]}>
            <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, getTextAlignStyle()]}
              placeholder={safeT('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textAlign={getTextAlignStyle().textAlign}
            />
          </View>
        </View>
        
        <View style={[styles.buttonContainer, getFlowStyle()]}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>{safeT('common.cancel')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{safeT('auth.sendResetLink')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1E293B',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
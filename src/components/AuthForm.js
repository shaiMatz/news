import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Svg,
  Path
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import useLocalization from '../hooks/useLocalization';
import ErrorMessage from './ErrorMessage';
import { ErrorTypes, handleError, getErrorType } from '../utils/errorUtils';
import { ApiError, requestPasswordReset } from '../services/api';
import { isOnline } from '../utils/connectivityUtils';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import ForgotPasswordForm from './ForgotPasswordForm';

/**
 * Google logo as an SVG component
 * Used in the Google Sign-in button
 */
const GoogleLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

/**
 * Authentication form component with login and registration functionality
 */
export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const { login, register, loading, error: authError, socialLogin } = useAuth();
  const { safeT, getTextAlignStyle, getDirectionStyle, getContainerStyle } = useLocalization();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    // Clear form fields when switching between login and register
    setUsername('');
    setPassword('');
    setEmail('');
    // Clear any existing errors
    setError(null);
    setErrorType(null);
  };

  // Handle form field changes and clear errors
  const handleUsernameChange = (text) => {
    setUsername(text);
    if (error) setError(null); // Clear error when user starts typing
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (error) setError(null);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (error) setError(null);
  };

  // Check for network connectivity
  const checkConnectivity = async () => {
    const online = await isOnline();
    if (!online) {
      setError(safeT('connectivity.checkConnection'));
      setErrorType(ErrorTypes.NETWORK);
      return false;
    }
    return true;
  };

  // Handle social login attempts
  const handleSocialLogin = async (provider) => {
    // First clear any previous errors
    setError(null);
    setErrorType(null);

    // Check for connectivity
    const isConnected = await checkConnectivity();
    if (!isConnected) return;

    try {
      await socialLogin(provider);
      // If successful, clear any errors
      setError(null);
      setErrorType(null);
    } catch (err) {
      const errorMessage = (err && err.name === 'ApiError')
        ? err.getUserMessage()
        : handleError(err, 'AuthForm');

      // Set appropriate error type for UI feedback
      const errType = (err && err.name === 'ApiError')
        ? err.type
        : getErrorType(err);

      setError(errorMessage);
      setErrorType(errType);
    }
  };

  const handleSubmit = async () => {
    // First clear any previous errors
    setError(null);
    setErrorType(null);

    // Check for connectivity
    const isConnected = await checkConnectivity();
    if (!isConnected) return;

    // Basic validation with proper error feedback
    if (!username.trim()) {
      setError('Please enter your username');
      setErrorType(ErrorTypes.VALIDATION);
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      setErrorType(ErrorTypes.VALIDATION);
      return;
    }

    // Username validation for registration
    if (!isLogin && !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setError('Username must be 3-30 characters and can only contain letters, numbers, underscores and hyphens');
      setErrorType(ErrorTypes.VALIDATION);
      return;
    }

    // Email validation if registering
    if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setErrorType(ErrorTypes.VALIDATION);
      return;
    }

    // Password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setErrorType(ErrorTypes.VALIDATION);
      return;
    }

    // Password strength validation for registration
    if (!isLogin && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      setErrorType(ErrorTypes.VALIDATION);
      return;
    }

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      // If successful, clear any errors
      setError(null);
      setErrorType(null);
    } catch (err) {
      const errorMessage = (err && err.name === 'ApiError')
        ? err.getUserMessage()
        : handleError(err, 'AuthForm');

      const errType = (err && err.name === 'ApiError')
        ? err.type
        : getErrorType(err);

      setError(errorMessage);
      setErrorType(errType);
    }
  };

  // Handle forgot password submission
  const handleForgotPassword = async (email) => {
    try {
      await requestPasswordReset(email);
      setForgotPasswordSuccess(true);
      setShowForgotPassword(false);
    } catch (err) {
      // Show error in the forgot password form
      const errorMessage = err instanceof ApiError 
        ? err.getUserMessage()
        : handleError(err, 'ForgotPassword');
      
      // Return the error to be displayed in the form
      return errorMessage;
    }
  };

  return (
    <View style={styles.container}>
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <Modal
          visible={showForgotPassword}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ForgotPasswordForm 
                onCancel={() => setShowForgotPassword(false)}
                onSuccess={() => {
                  setForgotPasswordSuccess(true);
                  setShowForgotPassword(false);
                }}
                onSubmit={handleForgotPassword}
              />
            </View>
          </View>
        </Modal>
      )}
      
      <View style={[styles.formTypeSelector, getDirectionStyle()]}>
        <TouchableOpacity
          style={[styles.formTypeButton, isLogin && styles.activeFormType]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.formTypeText, getTextAlignStyle(), isLogin && styles.activeFormTypeText]}>
            {safeT('auth.login')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formTypeButton, !isLogin && styles.activeFormType]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.formTypeText, getTextAlignStyle(), !isLogin && styles.activeFormTypeText]}>
            {safeT('auth.register')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, getTextAlignStyle()]}>{safeT('auth.username')}</Text>
          <View style={[styles.inputContainer, getDirectionStyle()]}>
            <Feather name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, getTextAlignStyle()]}
              placeholder={safeT('auth.username')}
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              textAlign={getTextAlignStyle().textAlign}
            />
          </View>
        </View>

        {error && (
          <ErrorMessage
            message={error}
            icon={
              errorType === ErrorTypes.NETWORK ? 'wifi-off' :
                errorType === ErrorTypes.VALIDATION ? 'alert-circle' :
                  errorType === ErrorTypes.AUTH ? 'lock' : 'alert-triangle'
            }
            onRetry={
              errorType === ErrorTypes.NETWORK ?
                () => checkConnectivity().then(isConnected => {
                  if (isConnected) setError(null);
                }) :
                null
            }
            showRetry={errorType === ErrorTypes.NETWORK}
          />
        )}

        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, getTextAlignStyle()]}>{safeT('auth.email')}</Text>
            <View style={[styles.inputContainer, getDirectionStyle()]}>
              <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, getTextAlignStyle()]}
                placeholder={safeT('auth.emailPlaceholder')}
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                textAlign={getTextAlignStyle().textAlign}
              />
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, getTextAlignStyle()]}>{safeT('auth.password')}</Text>
          <View style={[styles.inputContainer, getDirectionStyle()]}>
            <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, getTextAlignStyle()]}
              placeholder={safeT('auth.passwordPlaceholder')}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              textAlign={getTextAlignStyle().textAlign}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>
          
          {/* Show password strength indicator for registration */}
          {!isLogin && password.length > 0 && (
            <View style={styles.strengthIndicatorContainer}>
              <PasswordStrengthIndicator password={password} />
            </View>
          )}
        </View>

        {isLogin && (
          <TouchableOpacity 
            style={[styles.forgotPassword, { alignSelf: getTextAlignStyle().textAlign === 'right' ? 'flex-start' : 'flex-end' }]}
            onPress={() => setShowForgotPassword(true)}
          >
            <Text style={[styles.forgotPasswordText, getTextAlignStyle()]}>{safeT('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        )}
        
        {/* Forgot password success message */}
        {forgotPasswordSuccess && (
          <View style={styles.successContainer}>
            <Feather name="check-circle" size={20} color="#10B981" style={styles.successIcon} />
            <Text style={styles.successText}>{safeT('auth.resetLinkSent')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.submitButtonText, getTextAlignStyle()]}>
              {isLogin ? safeT('auth.login') : safeT('auth.createAccount')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.socialLoginContainer}>
          <Text style={[styles.socialLoginText, getTextAlignStyle()]}>{safeT('auth.continueWith')}</Text>
          <View style={[styles.socialButtonsContainer, getDirectionStyle()]}>
            {/* Google Sign-in Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton, getDirectionStyle()]}
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
              accessibilityLabel={safeT('auth.googleAccessibilityLabel')}
            >
              <View style={styles.googleIconContainer}>
                {/* Google logo SVG */}
                <GoogleLogo />
              </View>
              <Text style={[styles.socialButtonText, styles.googleButtonText, getTextAlignStyle()]}>
                {safeT('auth.signInWithGoogle')}
              </Text>
              {loading && <ActivityIndicator size="small" color="#4285F4" style={styles.buttonLoader} />}
            </TouchableOpacity>

            {/* Apple Sign-in Button - iOS Only */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton, getDirectionStyle()]}
                onPress={() => handleSocialLogin('apple')}
                disabled={loading}
                accessibilityLabel={safeT('auth.appleAccessibilityLabel')}
              >
                <Feather name="smartphone" size={20} color="#FFFFFF" />
                <Text style={[styles.socialButtonText, styles.appleButtonText, getTextAlignStyle()]}>
                  {safeT('auth.signInWithApple')}
                </Text>
                {loading && <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.switchFormContainer, getDirectionStyle()]}>
          <Text style={[styles.switchFormText, getTextAlignStyle()]}>
            {isLogin ? safeT('auth.noAccount') : safeT('auth.haveAccount')}
          </Text>
          <TouchableOpacity onPress={toggleForm}>
            <Text style={[styles.switchFormLink, getTextAlignStyle()]}>
              {isLogin ? safeT('auth.register') : safeT('auth.login')}
            </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
  errorContainer: {
    marginBottom: 16,
  },
  formTypeSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  formTypeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeFormType: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  formTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFormTypeText: {
    color: '#2563EB',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
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
  passwordToggle: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#2563EB',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchFormContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchFormText: {
    color: '#64748B',
    marginHorizontal: 4,
  },
  switchFormLink: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  socialLoginContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  socialLoginText: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 12,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    minWidth: 140,
  },
  socialButtonText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  // Password strength indicator styles
  strengthIndicatorContainer: {
    marginTop: 8,
  },
  // Success message styles
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successIcon: {
    marginRight: 8,
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  googleIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 220,
    marginBottom: 10,
  },
  googleButtonText: {
    color: '#757575',
    fontWeight: '500',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    minWidth: 220,
    marginBottom: 10,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonLoader: {
    marginLeft: 8,
  },
});

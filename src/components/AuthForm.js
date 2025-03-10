import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import ErrorMessage from './ErrorMessage';
import { ErrorTypes, handleError } from '../utils/errorUtils';
import { ApiError } from '../services/api';
import { isOnline } from '../utils/connectivityUtils';

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
  const { login, register, loading, error: authError, socialLogin } = useAuth();

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
      setError('Please check your internet connection and try again.');
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
      // Use our error handling utilities
      const errorMessage = err instanceof ApiError 
        ? err.getUserMessage()
        : handleError(err, 'AuthForm');
      
      // Set appropriate error type for UI feedback
      const errType = err instanceof ApiError 
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
    
    // Username validation
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
      // Use our error handling utilities
      const errorMessage = err instanceof ApiError 
        ? err.getUserMessage()
        : handleError(err, 'AuthForm');
      
      // Set appropriate error type for UI feedback
      const errType = err instanceof ApiError 
        ? err.type 
        : getErrorType(err);
      
      setError(errorMessage);
      setErrorType(errType);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formTypeSelector}>
        <TouchableOpacity
          style={[styles.formTypeButton, isLogin && styles.activeFormType]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.formTypeText, isLogin && styles.activeFormTypeText]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formTypeButton, !isLogin && styles.activeFormType]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.formTypeText, !isLogin && styles.activeFormTypeText]}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
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
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
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
        </View>

        {isLogin && (
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isLogin ? "Login" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.socialLoginContainer}>
          <Text style={styles.socialLoginText}>Or continue with</Text>
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
            >
              <Feather name="mail" size={20} color="#EA4335" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('apple')}
                disabled={loading}
              >
                <Feather name="smartphone" size={20} color="#000000" />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.switchFormContainer}>
          <Text style={styles.switchFormText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </Text>
          <TouchableOpacity onPress={toggleForm}>
            <Text style={styles.switchFormLink}>
              {isLogin ? "Register" : "Login"}
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
    marginRight: 4,
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
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});

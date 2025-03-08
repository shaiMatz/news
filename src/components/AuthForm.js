import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

/**
 * Authentication form component with login and registration functionality
 */
export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, loading } = useAuth();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    // Clear form fields when switching between login and register
    setUsername('');
    setPassword('');
    setEmail('');
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!username.trim()) {
      Alert.alert('Missing Username', 'Please enter your username');
      return;
    }
    
    if (!password.trim() || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }
    
    if (!isLogin && !email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address');
      return;
    }
    
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert(
        'Authentication Error', 
        isLogin 
          ? 'Login failed. Please check your credentials and try again.' 
          : 'Registration failed. This username or email may already be in use.'
      );
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
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
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
              onChangeText={setPassword}
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
});

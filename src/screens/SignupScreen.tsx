import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts';
import { MaterialIcons } from '@expo/vector-icons';
import { validatePassword } from '../utils/passwordValidation';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const SignupScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { signup, error, errorTranslationKey, clearError } = useAuth();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // Show error popup when error changes (only for Firebase errors that bypass client validation)
  useEffect(() => {
    if (error && errorTranslationKey) {
      // Only show Firebase errors that have translation keys
      // Client-side validation errors are handled in validateForm()
      const errorMessage = t(`errors.${errorTranslationKey}`);
      Alert.alert(t('common.error'), errorMessage, [
        { text: t('common.ok'), onPress: () => clearError() }
      ]);
    }
  }, [errorTranslationKey, clearError, t]); // Removed 'error' from dependencies to prevent double alerts

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // Client-side validation for fields that Firebase won't validate
    if (!formData.firstName.trim()) {
      Alert.alert(t('common.error'), t('auth.firstNameRequired'));
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert(t('common.error'), t('auth.lastNameRequired'));
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return false;
    }
    // Basic email format validation to prevent Firebase errors
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
      return false;
    }
    if (!formData.password) {
      Alert.alert(t('common.error'), t('auth.passwordRequired'));
      return false;
    }
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      const failedRule = passwordValidation.failedRules[0];
      Alert.alert(t('common.error'), t(failedRule.messageKey));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDontMatch'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      clearError();
      await signup(formData.email.trim(), formData.password, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        preferences: {
          language: i18n.language,
          units: 'metric'
        }
      });
      setIsSuccess(true);
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };



  const handleNavigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleContinueToVerification = () => {
    navigation.navigate('EmailVerification' as never);
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✅</Text>
              </View>
              
              <Text style={styles.successTitle}>{t('auth.accountCreatedSuccess')}</Text>
              <Text style={styles.successSubtitle}>
                {t('auth.verificationEmailSentTo')}
              </Text>
              <Text style={styles.emailText}>{formData.email}</Text>
              
              <Text style={styles.instructionsText}>
                {t('auth.checkEmailVerification')}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleContinueToVerification}>
                  <Text style={styles.primaryButtonText}>{t('auth.continueToVerification')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} onPress={handleNavigateToLogin}>
                  <Text style={styles.secondaryButtonText}>{t('auth.backToLogin')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  {t('auth.didntReceiveEmail')}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            {/* <Text style={styles.subtitle}>{t('auth.signUpSubtitle')}</Text> */}
          </View>
          
          <View style={styles.formContainer}>
            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>{t('auth.firstName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterFirstName')}
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>{t('auth.lastName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enterLastName')}
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.email')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.enterEmail')}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.password')} *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder={t('auth.enterPassword')}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons 
                    name={showPassword ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              <PasswordStrengthIndicator 
                password={formData.password} 
                showRules={true}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.confirmPassword')} *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder={t('auth.confirmYourPassword')}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialIcons 
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSubmit} 
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity style={styles.linkButton} onPress={handleNavigateToLogin}>
                <Text style={styles.linkText}>{t('auth.alreadyHaveAccount')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eyeButton: {
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkButton: {
    marginVertical: 4,
  },
  linkText: {
    color: '#2196f3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // Success state styles
  successContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  helpContainer: {
    paddingHorizontal: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SignupScreen;

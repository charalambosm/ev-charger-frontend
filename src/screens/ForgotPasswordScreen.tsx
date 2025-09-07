import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { forgotPassword, error, errorTranslationKey, clearError } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Show error popup when error changes (only for Firebase errors)
  useEffect(() => {
    if (error && errorTranslationKey) {
      // Only show Firebase errors that have translation keys
      const errorMessage = t(`errors.${errorTranslationKey}`);
      Alert.alert(t('common.error'), errorMessage, [
        { text: t('common.ok'), onPress: () => clearError() }
      ]);
    }
  }, [error, errorTranslationKey, clearError, t]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.pleaseEnterEmail'));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      await forgotPassword(email.trim());
      setIsSuccess(true);
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleTryAgain = () => {
    setIsSuccess(false);
    setEmail('');
    clearError();
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
              
              <Text style={styles.successTitle}>{t('auth.checkYourEmail')}</Text>
              <Text style={styles.successSubtitle}>
                {t('auth.resetEmailSent')}
              </Text>
              <Text style={styles.emailText}>{email}</Text>
              
              <Text style={styles.instructionsText}>
                {t('auth.resetEmailInstructions')}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleBackToLogin}>
                  <Text style={styles.primaryButtonText}>{t('auth.backToLogin')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} onPress={handleTryAgain}>
                  <Text style={styles.secondaryButtonText}>{t('auth.tryDifferentEmail')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.helpContainer}>
                <Text style={styles.helpText}>
                  {t('auth.didntReceiveResetEmail')}
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
            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
              <Text style={styles.backButtonText}>{t('auth.back')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock-reset" size={48} color="#333" />
            </View>
            
            <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgotPasswordSubtitle')}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.enterEmailAddress')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSubmit} 
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
              </Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity style={styles.linkButton} onPress={handleBackToLogin}>
                <Text style={styles.linkText}>{t('auth.rememberPassword')}</Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  backButtonText: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '500',
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
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

export default ForgotPasswordScreen;

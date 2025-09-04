import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts';
import { setStoredLanguage } from '../utils/i18n';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, clearError, continueAsGuest } = useAuth();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // Show error popup when error changes
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error, [
        { text: t('common.ok'), onPress: () => clearError() }
      ]);
    }
  }, [error, clearError, t]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      const result = await login(email.trim(), password.trim());
      
      // Check if email is verified
      if (result.user && !result.user.emailVerified) {
        Alert.alert(
          t('auth.emailNotVerified'),
          t('auth.checkEmailVerification'),
          [
            { text: t('common.ok'), onPress: () => navigation.navigate('EmailVerification' as never) }
          ]
        );
      }
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
  };

  const handleNavigateToSignup = () => {
    navigation.navigate('Signup' as never);
  };

  const handleLanguageSwitch = async () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'en' ? 'el' : 'en';
    await setStoredLanguage(newLang);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              💡 {t('auth.guestBrowseInfo')}
            </Text>
          </View>
          <View style={styles.formContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
              <TouchableOpacity style={styles.languageButton} onPress={handleLanguageSwitch}>
                <Text style={styles.languageButtonText}>
                  {i18n.language === 'en' ? 'EL' : 'EN'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.enterEmail')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.enterPassword')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSubmit} 
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t('common.loading') : t('auth.signIn')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.linksContainer}>
              <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('ForgotPassword' as never)}>
                <Text style={styles.linkText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkButton} onPress={handleNavigateToSignup}>
                <Text style={styles.linkText}>{t('auth.dontHaveAccount')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.skipContainer}>
              <Text style={styles.skipText}>{t('auth.orContinueAsGuest')}</Text>
              <TouchableOpacity style={styles.skipButton} onPress={handleContinueAsGuest}>
                <Text style={styles.skipButtonText}>{t('auth.browseStations')}</Text>
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
  infoBanner: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoText: {
    color: '#1976d2',
    fontSize: 14,
    lineHeight: 20,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  languageButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
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
    marginBottom: 24,
  },
  linkButton: {
    marginVertical: 4,
  },
  linkText: {
    color: '#2196f3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  skipContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  skipText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  skipButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;

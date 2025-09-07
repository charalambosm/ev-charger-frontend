import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts';
import { setStoredLanguage } from '../utils/i18n';
import { MaterialIcons } from '@expo/vector-icons';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const { login, error, errorTranslationKey, clearError, continueAsGuest } = useAuth();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

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
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    
    // Basic email format validation to prevent Firebase errors
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
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

  const handleLanguageSelect = async (languageCode: string) => {
    await setStoredLanguage(languageCode);
    setShowLanguageModal(false);
  };

  const openLanguageModal = () => {
    setShowLanguageModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              💡 {t('auth.guestBrowseInfo')}
            </Text>
          </View> */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
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
            
            <View style={styles.languageSection}>
              <Text style={styles.languageText}>{t('profile.changeLanguage')}</Text>
              <TouchableOpacity style={styles.languageSelector} onPress={openLanguageModal}>
                <Text style={styles.languageFlag}>
                  {i18n.language === 'en' ? '🇬🇧' : '🇬🇷'}
                </Text>
                <Text style={styles.languageSelectorText}>
                  {i18n.language === 'en' ? 'English' : 'Ελληνικά'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Language Selection Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showLanguageModal}
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowLanguageModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
              
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  i18n.language === 'en' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('en')}
              >
                <Text style={[
                  styles.languageOptionText,
                  i18n.language === 'en' && styles.languageOptionTextSelected
                ]}>
                  🇬🇧 English
                </Text>
                {i18n.language === 'en' && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  i18n.language === 'el' && styles.languageOptionSelected
                ]}
                onPress={() => handleLanguageSelect('el')}
              >
                <Text style={[
                  styles.languageOptionText,
                  i18n.language === 'el' && styles.languageOptionTextSelected
                ]}>
                  🇬🇷 Ελληνικά
                </Text>
                {i18n.language === 'el' && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
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
  languageSection: {
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  languageText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  languageFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  languageSelectorText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  languageOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  languageOptionTextSelected: {
    color: '#2196f3',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196f3',
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;

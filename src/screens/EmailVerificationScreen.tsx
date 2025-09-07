import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts';

const EmailVerificationScreen: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const { user, isEmailVerified, sendVerificationEmail, refreshUserVerificationStatus, error, clearError, logout } = useAuth();
  const { t } = useTranslation();

  // Auto-check verification status periodically
  useEffect(() => {
    if (!user || isEmailVerified) return;

    const checkVerificationStatus = async () => {
      try {
        setIsAutoChecking(true);
        await refreshUserVerificationStatus();
        setLastChecked(new Date());
      } catch (error) {
        console.log('Auto-check failed:', error);
      } finally {
        setIsAutoChecking(false);
      }
    };

    // Initial check after 3 seconds
    const initialTimeout = setTimeout(checkVerificationStatus, 3000);

    // Then check every 10 seconds
    const interval = setInterval(checkVerificationStatus, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, isEmailVerified, refreshUserVerificationStatus]);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      clearError();
      await sendVerificationEmail();
      Alert.alert(
        'Verification Email Sent',
        'A new verification email has been sent to your email address.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsResending(false);
    }
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserVerificationStatus();
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = () => {
    // Sign out and return to login
    logout();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{t('emailVerification.noUserFound')}</Text>
          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>{t('emailVerification.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196f3']}
            tintColor="#2196f3"
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📧</Text>
          </View>
          
          <Text style={styles.title}>{t('emailVerification.title')}</Text>
          <Text style={styles.subtitle}>
            {t('emailVerification.subtitle')}
          </Text>
          <Text style={styles.emailText}>{user.email}</Text>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>{t('emailVerification.instructionsTitle')}</Text>
            <Text style={styles.instruction}>{t('emailVerification.instruction1')}</Text>
            <Text style={styles.instruction}>{t('emailVerification.instruction2')}</Text>
            <Text style={styles.instruction}>{t('emailVerification.instruction3')}</Text>
          </View>

          {isAutoChecking && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{t('emailVerification.checkingStatus')}</Text>
            </View>
          )}

          {lastChecked && !isAutoChecking && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{t('emailVerification.lastChecked')} {lastChecked.toLocaleTimeString()}</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, isResending && styles.buttonDisabled]} 
              onPress={handleResendEmail}
              disabled={isResending}
            >
              <Text style={styles.primaryButtonText}>
                {isResending ? t('emailVerification.sending') : t('emailVerification.resendEmail')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>{t('emailVerification.needHelp')}</Text>
            <Text style={styles.helpText}>
              {t('emailVerification.helpText')}
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>{t('emailVerification.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    width: '100%',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signOutButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  statusText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmailVerificationScreen;

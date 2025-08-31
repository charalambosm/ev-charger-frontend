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

import { useAuth } from '../contexts';

const EmailVerificationScreen: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, isEmailVerified, sendVerificationEmail, refreshUserVerificationStatus, error, clearError, logout } = useAuth();

  // Check verification status periodically
  useEffect(() => {
    if (user && isEmailVerified) {
      // Email verified - the app will automatically navigate to main app
      // No manual navigation needed
    }
  }, [user, isEmailVerified]);

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

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      clearError();
      await refreshUserVerificationStatus();
      
      if (isEmailVerified) {
        Alert.alert(
          'Email Verified!',
          'Your email has been verified successfully. You will be redirected to the main app.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Email Not Yet Verified',
          'Your email has not been verified yet. Please check your email and click the verification link, then try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsChecking(false);
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
          <Text style={styles.errorText}>No user found. Please sign in again.</Text>
          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Back to Login</Text>
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
          
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification email to:
          </Text>
          <Text style={styles.emailText}>{user.email}</Text>
          
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>To complete your registration:</Text>
            <Text style={styles.instruction}>1. Check your email inbox</Text>
            <Text style={styles.instruction}>2. Click the verification link</Text>
            <Text style={styles.instruction}>3. Return to this app and click "Check Verification"</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, isChecking && styles.buttonDisabled]} 
              onPress={handleCheckVerification}
              disabled={isChecking}
            >
              <Text style={styles.primaryButtonText}>
                {isChecking ? 'Checking...' : 'Check Verification Status'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, isResending && styles.buttonDisabled]} 
              onPress={handleResendEmail}
              disabled={isResending}
            >
              <Text style={styles.secondaryButtonText}>
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              • Check your spam/junk folder{'\n'}
              • Make sure you entered the correct email{'\n'}
              • Wait a few minutes for the email to arrive{'\n'}
              • Click "Check Verification Status" after verifying{'\n'}
              • Pull down to refresh this screen
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Back to Login</Text>
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
});

export default EmailVerificationScreen;

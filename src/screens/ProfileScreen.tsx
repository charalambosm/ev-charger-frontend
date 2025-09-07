import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,

  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts';
import { UserService, UserProfile } from '../services';
import { auth } from '../config/firebase';
import { deleteUser } from 'firebase/auth';
import { setStoredLanguage, getStoredLanguage } from '../utils/i18n';

const ProfileScreen: React.FC = () => {
  const { user, logout, isGuest, resetGuestState, reauthenticateUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [unitsModalVisible, setUnitsModalVisible] = useState(false);
  const [reauthModalVisible, setReauthModalVisible] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthenticating, setReauthenticating] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  // Fetch user profile when user changes
  useEffect(() => {
    if (user && !isGuest) {
      const loadProfile = async () => {
        setLoading(true);
        try {
          const profile = await UserService.getCurrentUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      };

      loadProfile();
    }
  }, [user, isGuest]);

  // Subscribe to real-time profile updates
  useEffect(() => {
    if (user && !isGuest) {
      const unsubscribe = UserService.subscribeToCurrentUserProfile((profile) => {
        setUserProfile(profile);
      });

      return unsubscribe;
    }
  }, [user, isGuest]);

  // Load current language
  useEffect(() => {
    const loadCurrentLanguage = async () => {
      const language = await getStoredLanguage();
      setCurrentLanguage(language);
    };
    loadCurrentLanguage();
  }, []);

  // Handle language change
  const handleLanguageChange = async (language: string) => {
    try {
      await setStoredLanguage(language);
      setCurrentLanguage(language);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), t('profile.errorUpdatingProfile'));
    }
  };



  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('profile.confirmSignOut'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleSignIn = () => {
    // Reset guest state to show login screen
    resetGuestState();
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.confirmDelete'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              t('common.confirm'),
              t('profile.confirmDelete'),
              [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: performDeleteProfile,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const performDeleteProfile = async () => {
    console.log(user);
    console.log(userProfile);
    if (!user || !userProfile) return;

    setLoading(true);
    
    // Store the UID before any deletion attempts
    const userUid = user.uid;
    
    try {
      // First delete the user profile from Firestore using the correct UID
      await UserService.deleteUserProfile(userUid);
      
      // Then delete the user from Firebase Auth
      await deleteUser(user);
      
      // Show success message
      Alert.alert(
        t('profile.accountDeleted'),
        t('profile.accountDeletedMessage'),
        [{ text: t('common.ok') }]
      );
      
      // The auth context should handle the logout automatically when the user is deleted
      // But we can also explicitly trigger logout to ensure clean state
      try {
        await logout();
      } catch (logoutError) {
        // Ignore logout errors since the user is already deleted
        console.log('Logout after deletion (expected):', logoutError);
      }
      
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          t('profile.authRequired'),
          t('profile.authRequiredMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('profile.verifyPasswordButton'), 
              onPress: () => setReauthModalVisible(true)
            }
          ]
        );
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert(
          t('profile.networkError'),
          t('profile.networkErrorMessage'),
          [{ text: t('common.ok') }]
        );
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert(
          t('profile.accountNotFound'),
          t('profile.accountNotFoundMessage'),
          [
            { 
              text: t('common.ok'),
              onPress: async () => {
                try {
                  await logout();
                } catch (logoutError) {
                  console.error('Logout error:', logoutError);
                }
              }
            }
          ]
        );
      } else {
        // Generic error with more helpful message
        const errorMessage = error.message || 'An unexpected error occurred';
        Alert.alert(
          t('profile.deleteFailed'),
          t('profile.deleteFailedMessage', { error: errorMessage }),
          [{ text: t('common.ok') }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string, currentValue: string) => {
    if (field === 'language') {
      setLanguageModalVisible(true);
    } else if (field === 'units') {
      setUnitsModalVisible(true);
    } else {
      setEditField(field);
      setEditValue(currentValue);
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!userProfile || !editValue.trim()) return;

    setSaving(true);
    try {
      let updateData: any = {};

      switch (editField) {
        case 'firstName':
          updateData.firstName = editValue.trim();
          break;
        case 'lastName':
          updateData.lastName = editValue.trim();
          break;
        case 'language':
          updateData.preferences = {
            ...userProfile.preferences,
            language: editValue.trim()
          };
          break;
        case 'units':
          updateData.preferences = {
            ...userProfile.preferences,
            units: editValue.trim()
          };
          break;
      }

      await UserService.updateUserProfile(userProfile.id, updateData);
      setEditModalVisible(false);
      setEditValue('');
      setEditField('');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), t('profile.errorUpdatingProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditValue('');
    setEditField('');
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setSaving(true);
    try {
      // Update i18n language
      await handleLanguageChange(languageCode);
      
      // Also update user profile if user is logged in
      if (userProfile) {
        const updateData = {
          preferences: {
            ...userProfile.preferences,
            language: languageCode
          }
        };
        await UserService.updateUserProfile(userProfile.id, updateData);
      }
      
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert(t('common.error'), t('profile.errorUpdatingProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleUnitsSelect = async (unitsCode: 'metric' | 'imperial') => {
    if (!userProfile) return;

    setSaving(true);
    try {
      const updateData = {
        preferences: {
          ...userProfile.preferences,
          units: unitsCode
        }
      };

      await UserService.updateUserProfile(userProfile.id, updateData);
      setUnitsModalVisible(false);
    } catch (error) {
      console.error('Error updating units:', error);
      Alert.alert(t('common.error'), t('profile.errorUpdatingProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleReauthenticate = async () => {
    if (!reauthPassword.trim()) {
      Alert.alert(t('common.error'), t('profile.enterPasswordError'));
      return;
    }

    setReauthenticating(true);
    try {
      await reauthenticateUser(reauthPassword);
      setReauthModalVisible(false);
      setReauthPassword('');
      
      // Show success message and prompt to try deletion again
      Alert.alert(
        t('profile.authSuccessful'),
        t('profile.authSuccessfulMessage'),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      console.error('Re-authentication error:', error);
      Alert.alert(
        t('profile.authFailed'),
        error.message || t('profile.authFailedMessage'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setReauthenticating(false);
    }
  };

  const handleCancelReauth = () => {
    setReauthModalVisible(false);
    setReauthPassword('');
  };

  // If user is not authenticated and not a guest, show login prompt
  if (!user && !isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            {/* Profile title removed - already shown in top tab */}
          </View>

          <View style={styles.guestContainer}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={48} color="#666" />
            </View>

            <Text style={styles.guestTitle}>{t('profile.guestUser')}</Text>
            <Text style={styles.guestSubtitle}>
              {t('profile.guestWelcome')}
            </Text>

            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>{t('profile.guestFeature1')}</Text>
              <Text style={styles.featureItem}>{t('profile.guestFeature2')}</Text>
              <Text style={styles.featureItem}>{t('profile.guestFeature3')}</Text>
              <Text style={styles.featureItem}>{t('profile.guestFeature4')}</Text>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>{t('profile.signIn')} / {t('profile.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If user is a guest, show guest profile with option to sign in
  if (isGuest && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            {/* Profile title removed - already shown in top tab */}
          </View>

          <View style={styles.guestContainer}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={48} color="#666" />
            </View>

            <Text style={styles.guestTitle}>{t('profile.guestUser')}</Text>
            <Text style={styles.guestSubtitle}>
              {t('profile.guestBrowsing')}
            </Text>

            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>{t('profile.guestFeature1')}</Text>
              <Text style={styles.featureItem}>{t('profile.guestFeature2')}</Text>
              <Text style={styles.featureItem}>{t('profile.guestFeature3')}</Text>
              <Text style={styles.featureItem}>{t('profile.guestFeature4')}</Text>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>{t('profile.signIn')} / {t('profile.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If user is authenticated, show profile
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          {/* Profile title removed - already shown in top tab */}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{t('profile.loadingProfile')}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.userInfo}>
              {/* Profile Avatar */}
              <View style={styles.avatarContainer}>
                                 <View style={[styles.avatar, styles.avatarWithInitials]}>
                   <Text style={styles.avatarInitials}>
                     {(userProfile?.firstName?.charAt(0).toUpperCase() || '') + 
                      (userProfile?.lastName?.charAt(0).toUpperCase() || '') || 
                      user?.email?.charAt(0).toUpperCase() || 'U'}
                   </Text>
                 </View>
              </View>

              {/* Profile Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

                {userProfile?.firstName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('profile.firstName')}:</Text>
                    <View style={styles.infoValueContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit('firstName', userProfile.firstName)}
                      >
                        <MaterialIcons name="edit" size={20} color="#000000" />
                      </TouchableOpacity>
                      <Text style={styles.infoValue}>{userProfile.firstName}</Text>
                    </View>
                  </View>
                )}

                {userProfile?.lastName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('profile.lastName')}:</Text>
                    <View style={styles.infoValueContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit('lastName', userProfile.lastName)}
                      >
                        <MaterialIcons name="edit" size={20} color="#000000" />
                      </TouchableOpacity>
                      <Text style={styles.infoValue}>{userProfile.lastName}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('profile.email')}:</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('profile.dateJoined')}:</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.createdAt
                      ? (() => {
                        try {
                          // Handle Firestore Timestamp objects
                          const createdAt = userProfile.createdAt;
                          if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
                            return (createdAt as any).toDate().toLocaleDateString();
                          }
                          // Handle regular Date objects or timestamps
                          return new Date(createdAt).toLocaleDateString();
                        } catch (error) {
                          console.error('Error parsing createdAt date:', error);
                          return 'Unknown';
                        }
                      })()
                      : user?.metadata?.creationTime
                        ? new Date(user.metadata.creationTime).toLocaleDateString()
                        : 'Unknown'
                    }
                  </Text>
                </View>
              </View>

              {/* Preferences */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('profile.language')}:</Text>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setLanguageModalVisible(true)}
                    >
                      <MaterialIcons name="edit" size={20} color="#000000" />
                    </TouchableOpacity>
                    <Text style={styles.infoValue}>
                      {currentLanguage === 'en' ? t('profile.english') :
                        currentLanguage === 'el' ? t('profile.greek') :
                          t('profile.english')}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('profile.units')}:</Text>
                  <View style={styles.infoValueContainer}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit('units', userProfile?.preferences?.units || 'metric')}
                    >
                      <MaterialIcons name="edit" size={20} color="#000000" />
                    </TouchableOpacity>
                    <Text style={styles.infoValue}>
                      {userProfile?.preferences?.units === 'metric' ? t('profile.kilometers') :
                        userProfile?.preferences?.units === 'imperial' ? t('profile.miles') :
                          t('profile.kilometers')}
                    </Text>
                  </View>
                </View>
              </View>


            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>{t('profile.signOut')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProfile}>
              <Text style={styles.deleteButtonText}>{t('profile.deleteAccount')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
{t('common.edit')} {editField === 'firstName' ? t('profile.firstName') :
                editField === 'lastName' ? t('profile.lastName') :
                  editField === 'language' ? t('profile.language') :
                    editField === 'units' ? t('profile.units') : 'Field'}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editField === 'firstName' ? 'first name' :
                editField === 'lastName' ? 'last name' :
                  editField === 'language' ? 'language (en/el)' :
                    editField === 'units' ? 'units (metric/imperial)' : 'value'}`}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={saving || !editValue.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? t('common.loading') : t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Distance Units Selection Modal */}
      <Modal
        visible={unitsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUnitsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.unitsModalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectUnitsTitle')}</Text>

            <TouchableOpacity
              style={[styles.unitsOption, userProfile?.preferences?.units === 'metric' && styles.unitsOptionSelected]}
              onPress={() => handleUnitsSelect('metric')}
              disabled={saving}
            >
              <Text style={[styles.unitsOptionText, userProfile?.preferences?.units === 'metric' && styles.unitsOptionTextSelected]}>
                {t('profile.metricUnits')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.unitsOption, userProfile?.preferences?.units === 'imperial' && styles.unitsOptionSelected]}
              onPress={() => handleUnitsSelect('imperial')}
              disabled={saving}
            >
              <Text style={[styles.unitsOptionText, userProfile?.preferences?.units === 'imperial' && styles.unitsOptionTextSelected]}>
                {t('profile.imperialUnits')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unitsModalCancelButton}
              onPress={() => setUnitsModalVisible(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>

            <TouchableOpacity
              style={[styles.languageOption, currentLanguage === 'en' && styles.languageOptionSelected]}
              onPress={() => handleLanguageSelect('en')}
              disabled={saving}
            >
              <Text style={[styles.languageOptionText, currentLanguage === 'en' && styles.languageOptionTextSelected]}>
                {t('profile.english')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageOption, currentLanguage === 'el' && styles.languageOptionSelected]}
              onPress={() => handleLanguageSelect('el')}
              disabled={saving}
            >
              <Text style={[styles.languageOptionText, currentLanguage === 'el' && styles.languageOptionTextSelected]}>
                {t('profile.greek')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.languageModalCancelButton}
              onPress={() => setLanguageModalVisible(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Re-authentication Modal */}
      <Modal
        visible={reauthModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelReauth}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.verifyPassword')}</Text>
            <Text style={styles.reauthSubtitle}>
              {t('profile.verifyPasswordSubtitle')}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={reauthPassword}
              onChangeText={setReauthPassword}
              placeholder={t('profile.enterPassword')}
              secureTextEntry={true}
              autoFocus={true}
              autoCapitalize="none"
              editable={!reauthenticating}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelReauth}
                disabled={reauthenticating}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleReauthenticate}
                disabled={reauthenticating || !reauthPassword.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {reauthenticating ? t('profile.verifying') : t('profile.verify')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    // marginBottom: 32,
  },
  guestContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarWithInitials: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresList: {
    marginBottom: 24,
    width: '100%',
  },
  featureItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 8,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
    textAlign: 'right',
    marginRight: 8,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 80,
  },
  editButton: {
    marginRight: 4,
    // padding: 4,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  nameContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    // marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  reauthSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Language selection modal styles
  languageModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  languageOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  languageOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  languageOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  languageModalCancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },

  // Distance units selection modal styles
  unitsModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  unitsOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  unitsOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitsOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  unitsOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  unitsModalCancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },

});

export default ProfileScreen;

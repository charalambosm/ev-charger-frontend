import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../contexts';
import { UserService, UserProfile } from '../services';

const ProfileScreen: React.FC = () => {
  const { user, logout, isGuest, resetGuestState } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [unitsModalVisible, setUnitsModalVisible] = useState(false);

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



  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
    if (!userProfile) return;
    
    setSaving(true);
    try {
      const updateData = {
        preferences: {
          ...userProfile.preferences,
          language: languageCode
        }
      };
      
      await UserService.updateUserProfile(userProfile.id, updateData);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert('Error', 'Failed to update language. Please try again.');
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
      Alert.alert('Error', 'Failed to update distance units. Please try again.');
    } finally {
      setSaving(false);
    }
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
              <Text style={styles.avatarText}>👤</Text>
            </View>

            <Text style={styles.guestTitle}>Guest User</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to access your profile and enhanced features
            </Text>

            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>✓ Save favorite stations</Text>
              <Text style={styles.featureItem}>✓ View charging history</Text>
              <Text style={styles.featureItem}>✓ Get personalized recommendations</Text>
              <Text style={styles.featureItem}>✓ Sync across devices</Text>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>Sign In / Sign Up</Text>
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
              <Text style={styles.avatarText}>👤</Text>
            </View>

            <Text style={styles.guestTitle}>Guest User</Text>
            <Text style={styles.guestSubtitle}>
              You're currently browsing as a guest. Sign in for enhanced features.
            </Text>

            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>✓ Save favorite stations</Text>
              <Text style={styles.featureItem}>✓ View charging history</Text>
              <Text style={styles.featureItem}>✓ Get personalized recommendations</Text>
              <Text style={styles.featureItem}>✓ Sync across devices</Text>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>Sign In / Sign Up</Text>
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
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.userInfo}>
              {/* Profile Photo */}
              <View style={styles.avatarContainer}>
                {userProfile?.photoURL ? (
                  <Image
                    source={{ uri: userProfile.photoURL }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarWithInitials]}>
                    <Text style={styles.avatarInitials}>
                      {userProfile?.firstName?.charAt(0).toUpperCase() ||
                        userProfile?.lastName?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Profile Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Information</Text>

                {userProfile?.firstName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>First Name:</Text>
                    <View style={styles.infoValueContainer}>
                      <Text style={styles.infoValue}>{userProfile.firstName}</Text>
                                             <TouchableOpacity
                         style={styles.editButton}
                         onPress={() => handleEdit('firstName', userProfile.firstName)}
                       >
                         <MaterialIcons name="edit" size={20} color="#000000" />
                       </TouchableOpacity>
                    </View>
                  </View>
                )}

                {userProfile?.lastName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Name:</Text>
                    <View style={styles.infoValueContainer}>
                      <Text style={styles.infoValue}>{userProfile.lastName}</Text>
                                             <TouchableOpacity
                         style={styles.editButton}
                         onPress={() => handleEdit('lastName', userProfile.lastName)}
                       >
                         <MaterialIcons name="edit" size={20} color="#000000" />
                       </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Account Created:</Text>
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
                <Text style={styles.sectionTitle}>Preferences</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Language:</Text>
                  <View style={styles.infoValueContainer}>
                                         <Text style={styles.infoValue}>
                       {userProfile?.preferences?.language === 'en' ? 'English' :
                         userProfile?.preferences?.language === 'gr' ? 'Greek' :
                           userProfile?.preferences?.language || 'English'}
                     </Text>
                                         <TouchableOpacity
                       style={styles.editButton}
                       onPress={() => handleEdit('language', userProfile?.preferences?.language || 'en')}
                     >
                       <MaterialIcons name="edit" size={20} color="#000000" />
                     </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Distance units:</Text>
                  <View style={styles.infoValueContainer}>
                                         <Text style={styles.infoValue}>
                       {userProfile?.preferences?.units === 'metric' ? 'metres / kilometres' :
                         userProfile?.preferences?.units === 'imperial' ? 'feet / miles' :
                           'metres / kilometres'}
                     </Text>
                                         <TouchableOpacity
                       style={styles.editButton}
                       onPress={() => handleEdit('units', userProfile?.preferences?.units || 'metric')}
                     >
                       <MaterialIcons name="edit" size={20} color="#000000" />
                     </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Favorites Count */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Favorites</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Saved Stations:</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.favorites?.length || 0} stations
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
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
              Edit {editField === 'firstName' ? 'First Name' :
                editField === 'lastName' ? 'Last Name' :
                  editField === 'language' ? 'Language' :
                    editField === 'units' ? 'Distance Units' : 'Field'}
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
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={saving || !editValue.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save'}
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
               <Text style={styles.modalTitle}>Select Distance Units</Text>
               
               <TouchableOpacity
                 style={[styles.unitsOption, userProfile?.preferences?.units === 'metric' && styles.unitsOptionSelected]}
                 onPress={() => handleUnitsSelect('metric')}
                 disabled={saving}
               >
                 <Text style={[styles.unitsOptionText, userProfile?.preferences?.units === 'metric' && styles.unitsOptionTextSelected]}>
                   metres / kilometres
                 </Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.unitsOption, userProfile?.preferences?.units === 'imperial' && styles.unitsOptionSelected]}
                 onPress={() => handleUnitsSelect('imperial')}
                 disabled={saving}
               >
                 <Text style={[styles.unitsOptionText, userProfile?.preferences?.units === 'imperial' && styles.unitsOptionTextSelected]}>
                   feet / miles
                 </Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={styles.unitsModalCancelButton}
                 onPress={() => setUnitsModalVisible(false)}
                 disabled={saving}
               >
                 <Text style={styles.cancelButtonText}>Cancel</Text>
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
               <Text style={styles.modalTitle}>Select Language</Text>
               
               <TouchableOpacity
                 style={[styles.languageOption, userProfile?.preferences?.language === 'en' && styles.languageOptionSelected]}
                 onPress={() => handleLanguageSelect('en')}
                 disabled={saving}
               >
                 <Text style={[styles.languageOptionText, userProfile?.preferences?.language === 'en' && styles.languageOptionTextSelected]}>
                   English
                 </Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.languageOption, userProfile?.preferences?.language === 'gr' && styles.languageOptionSelected]}
                 onPress={() => handleLanguageSelect('gr')}
                 disabled={saving}
               >
                 <Text style={[styles.languageOptionText, userProfile?.preferences?.language === 'gr' && styles.languageOptionTextSelected]}>
                   Greek
                 </Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={styles.languageModalCancelButton}
                 onPress={() => setLanguageModalVisible(false)}
                 disabled={saving}
               >
                 <Text style={styles.cancelButtonText}>Cancel</Text>
               </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    marginBottom: 32,
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
  avatarText: {
    fontSize: 32,
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
    marginLeft: 4,
    // padding: 4,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
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
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007AFF',
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

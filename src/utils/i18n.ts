import * as Localization from "expo-localization";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import el from '../locales/el.json';

const LANGUAGE_STORAGE_KEY = 'user_language';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      el: { translation: el },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Function to get the stored language preference or device language
export const getStoredLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) {
      return storedLanguage;
    }
    
    // Fall back to device language
    const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
    return deviceLanguage.toLowerCase().startsWith('el') ? 'el' : 'en';
  } catch (error) {
    console.error('Error getting stored language:', error);
    return 'en';
  }
};

// Function to save language preference
export const setStoredLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Initialize language on app start
export const initializeLanguage = async (): Promise<void> => {
  const language = await getStoredLanguage();
  await i18n.changeLanguage(language);
};

// Legacy pick function for backward compatibility with existing data
export const pick = (loc: {en: string; el: string}, locale?: string) => {
  const lang = (locale ?? i18n.language ?? "en").toLowerCase();
  return lang.startsWith("el") ? (loc.el || loc.en) : (loc.en || loc.el);
};

export default i18n;
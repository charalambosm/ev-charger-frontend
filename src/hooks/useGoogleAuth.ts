// Example: src/hooks/useGoogleAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:     'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId:     'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ scheme: 'evchargermap' }), // must match app.config "scheme"
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    const sub = onAuthStateChanged(auth, () => {});
    return () => sub();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params as any;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch(console.error);
      }
    }
  }, [response]);

  return { request, promptAsync };
}

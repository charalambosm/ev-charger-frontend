// Utility to map Firebase auth error codes to translation keys
export const getAuthErrorTranslationKey = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found': return 'authUserNotFound';
    case 'auth/wrong-password': return 'authWrongPassword';
    case 'auth/invalid-email': return 'authInvalidEmail';
    case 'auth/weak-password': return 'authWeakPassword';
    case 'auth/email-already-in-use': return 'authEmailAlreadyInUse';
    case 'auth/too-many-requests': return 'authTooManyRequests';
    case 'auth/network-request-failed': return 'authNetworkRequestFailed';
    case 'auth/user-disabled': return 'authUserDisabled';
    case 'auth/operation-not-allowed': return 'authOperationNotAllowed';
    case 'auth/invalid-credential': return 'authInvalidCredential';
    case 'auth/account-exists-with-different-credential': return 'authAccountExistsWithDifferentCredential';
    case 'auth/requires-recent-login': return 'authRequiresRecentLogin';
    case 'auth/credential-already-in-use': return 'authCredentialAlreadyInUse';
    case 'auth/timeout': return 'authTimeout';
    case 'auth/quota-exceeded': return 'authQuotaExceeded';
    case 'auth/invalid-action-code': return 'authInvalidActionCode';
    case 'auth/expired-action-code': return 'authExpiredActionCode';
    default: return 'authUnknownError';
  }
};

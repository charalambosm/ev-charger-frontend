export interface PasswordRule {
  id: string;
  test: (password: string) => boolean;
  messageKey: string;
  strength: number; // 1-5, higher is stronger
  hidden?: boolean; // Hide from UI display
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  failedRules: PasswordRule[];
  passedRules: PasswordRule[];
}

// Password rules with increasing strength requirements
export const passwordRules: PasswordRule[] = [
  {
    id: 'minLength',
    test: (password: string) => password.length >= 8,
    messageKey: 'auth.passwordMinLength',
    strength: 1
  },
  {
    id: 'hasLowercase',
    test: (password: string) => /[a-z]/.test(password),
    messageKey: 'auth.passwordLowercase',
    strength: 1
  },
  {
    id: 'hasUppercase',
    test: (password: string) => /[A-Z]/.test(password),
    messageKey: 'auth.passwordUppercase',
    strength: 2
  },
  {
    id: 'hasNumber',
    test: (password: string) => /\d/.test(password),
    messageKey: 'auth.passwordNumber',
    strength: 2
  },
  {
    id: 'hasSpecialChar',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    messageKey: 'auth.passwordSpecialChar',
    strength: 3
  },
  {
    id: 'minLengthStrong',
    test: (password: string) => password.length >= 12,
    messageKey: 'auth.passwordMinLengthStrong',
    strength: 2,
    hidden: true
  },
  {
    id: 'noCommonPatterns',
    test: (password: string) => {
      const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /abc123/i,
        /admin/i,
        /login/i,
        /welcome/i,
        /(.)\1{2,}/, // repeated characters like 'aaa'
      ];
      return !commonPatterns.some(pattern => pattern.test(password));
    },
    messageKey: 'auth.passwordNoCommon',
    strength: 2
  }
];

// Required rules that must pass for password to be acceptable
export const requiredRules = ['minLength', 'hasLowercase'];

export function validatePassword(password: string): PasswordValidationResult {
  const passedRules: PasswordRule[] = [];
  const failedRules: PasswordRule[] = [];
  
  passwordRules.forEach(rule => {
    if (rule.test(password)) {
      passedRules.push(rule);
    } else {
      failedRules.push(rule);
    }
  });
  
  // Calculate score based on passed rules
  const totalPossibleStrength = passwordRules.reduce((sum, rule) => sum + rule.strength, 0);
  const achievedStrength = passedRules.reduce((sum, rule) => sum + rule.strength, 0);
  const score = Math.round((achievedStrength / totalPossibleStrength) * 100);
  
  // Determine strength level
  let strength: PasswordValidationResult['strength'];
  if (score < 20) strength = 'very-weak';
  else if (score < 40) strength = 'weak';
  else if (score < 60) strength = 'fair';
  else if (score < 80) strength = 'good';
  else strength = 'strong';
  
  // Check if all required rules pass
  const requiredRulesPassed = requiredRules.every(ruleId => 
    passedRules.some(rule => rule.id === ruleId)
  );
  
  return {
    isValid: requiredRulesPassed,
    score,
    strength,
    failedRules,
    passedRules
  };
}

export function getPasswordStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very-weak': return '#f44336'; // Red
    case 'weak': return '#ff9800'; // Orange
    case 'fair': return '#ffeb3b'; // Yellow
    case 'good': return '#4caf50'; // Green
    case 'strong': return '#2e7d32'; // Dark Green
    default: return '#999';
  }
}

export function getPasswordStrengthText(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very-weak': return 'auth.passwordVeryWeak';
    case 'weak': return 'auth.passwordWeak';
    case 'fair': return 'auth.passwordFair';
    case 'good': return 'auth.passwordGood';
    case 'strong': return 'auth.passwordStrong';
    default: return '';
  }
}

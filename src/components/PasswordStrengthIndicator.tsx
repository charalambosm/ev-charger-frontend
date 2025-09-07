import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  validatePassword, 
  getPasswordStrengthColor, 
  getPasswordStrengthText,
  passwordRules,
  type PasswordValidationResult 
} from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRules?: boolean;
  compact?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showRules = false,
  compact = false 
}) => {
  const { t } = useTranslation();
  const validation = validatePassword(password);

  if (!password && !showRules) return null;

  const strengthColor = getPasswordStrengthColor(validation.strength);
  const strengthText = getPasswordStrengthText(validation.strength);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.strengthBarContainer}>
          <View 
            style={[
              styles.strengthBar, 
              { 
                width: `${validation.score}%`,
                backgroundColor: strengthColor 
              }
            ]} 
          />
        </View>
        <Text style={[styles.strengthText, { color: strengthColor }]}>
          {password ? t(strengthText) : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {password && (
        <View style={styles.strengthSection}>
          <Text style={styles.strengthLabel}>{t('auth.passwordStrength')}</Text>
          <View style={styles.strengthBarContainer}>
            <View 
              style={[
                styles.strengthBar, 
                { 
                  width: `${validation.score}%`,
                  backgroundColor: strengthColor 
                }
              ]} 
            />
          </View>
          <Text style={[styles.strengthText, { color: strengthColor }]}>
            {t(strengthText)} ({validation.score}%)
          </Text>
        </View>
      )}

      {showRules && (
        <View style={styles.rulesSection}>
          <Text style={styles.rulesTitle}>{t('auth.passwordRequirements')}</Text>
          {passwordRules.filter(rule => !rule.hidden).map((rule) => {
            const isPassed = validation.passedRules.some(r => r.id === rule.id);
            
            return (
              <View key={rule.id} style={styles.ruleItem}>
                <MaterialIcons 
                  name={isPassed ? 'check-circle' : 'radio-button-unchecked'} 
                  size={16} 
                  color={isPassed ? '#4caf50' : '#999'} 
                />
                <Text style={[
                  styles.ruleText, 
                  { 
                    color: isPassed ? '#4caf50' : '#666',
                    fontWeight: '400'
                  }
                ]}>
                  {t(rule.messageKey)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  compactContainer: {
    marginTop: 4,
  },
  strengthSection: {
    marginBottom: 12,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rulesSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  requiredNote: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default PasswordStrengthIndicator;

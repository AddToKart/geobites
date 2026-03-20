import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { UserRole } from '../../types';
import { Colors } from '../../utils/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp({ name, email, password, phone, role });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your Geobites profile</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <AppInput value={name} onChangeText={setName} placeholder="John Doe" />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <AppInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PHONE (OPTIONAL)</Text>
            <AppInput value={phone} onChangeText={setPhone} placeholder="+1 234 567 8900" />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <AppInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>I AM A...</Text>
            <View style={styles.roleRow}>
              {(['customer', 'seller', 'rider'] as UserRole[]).map((option) => (
                <AppButton
                  key={option}
                  label={option.charAt(0).toUpperCase() + option.slice(1)}
                  variant={role === option ? 'primary' : 'secondary'}
                  onPress={() => setRole(option)}
                  style={styles.roleButton}
                />
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <AppButton
              label={isSubmitting ? 'Creating account...' : 'Register'}
              onPress={() => void register()}
              disabled={isSubmitting}
            />
            <AppButton label="Back to login" variant="secondary" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingHorizontal: 0, 
    height: 44,
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

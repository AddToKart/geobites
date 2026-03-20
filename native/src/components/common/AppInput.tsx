import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { Colors } from '../../utils/colors';

export function AppInput(props: TextInputProps) {
  return <TextInput placeholderTextColor={Colors.textSecondary} style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: Colors.borderColor,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.bgCard,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
});

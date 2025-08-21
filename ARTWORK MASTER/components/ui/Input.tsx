import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: any;
  type?: 'text' | 'select';
  options?: { label: string; value: string }[];
  value?: any;
  onChangeText?: (text: string) => void;
  onValueChange?: (value: any) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  containerStyle,
  style,
  type = 'text',
  options = [],
  value,
  onChangeText,
  onValueChange,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (text: string) => {
    onChangeText?.(text);
  };

  const handleValueChange = (newValue: any) => {
    onValueChange?.(newValue);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      )}

      {type === 'select' && options.length > 0 ? (
        Platform.OS === 'web' ? (
          <View style={styles.selectWrapper}><select
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              style={{
                ...styles.input,
                fontFamily: 'inherit',
                appearance: 'none',
                padding: 12,
                width: '100%',
                borderRadius: 8,
                border: error ? `1px solid ${Colors.error}` : `1px solid ${Colors.gray300}`,
                backgroundColor: Colors.white,
                color: Colors.gray900,
              }}
            >
              <option value="">Please select...</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select></View>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={value}
              onValueChange={handleValueChange}
              style={styles.picker}
              dropdownIconColor={Colors.gray700}
            >
              <Picker.Item label="Please select..." value="" />
              {options.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
          </View>
        )
      ) : (
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}>
          {leftIcon && (
            <View style={styles.leftIcon}>
              {leftIcon}
            </View>
          )}
          <TextInput
            style={[
              styles.input,
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              style,
            ]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholderTextColor={Colors.gray400}
            value={value}
            onChangeText={handleTextChange}
            {...props}
          />
          {rightIcon && (
            <View style={styles.rightIcon}>
              {rightIcon}
            </View>
          )}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.gray700,
  },
  required: {
    color: Colors.error,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.gray900,
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.sm,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  rightIcon: {
    paddingRight: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    minHeight: 44,
    overflow: 'hidden',
    zIndex: 10,
  },
  picker: {
    height: 44,
    width: '100%',
    color: Colors.gray900,
  },
  inputFocused: {
    borderColor: Colors.secondary,
    borderWidth: 2,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  selectWrapper: {
    borderWidth: 0,
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
    minHeight: 44,
    overflow: 'hidden',
  },
}); 
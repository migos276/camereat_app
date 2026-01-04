import * as React from "react"
import { View, TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../constants/config"

interface TextInputProps {
  label?: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad"
  editable?: boolean
  rightIcon?: string
  onRightIconPress?: () => void
  multiline?: boolean
  numberOfLines?: number
  style?: any
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  editable = true,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <RNTextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {rightIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onRightIconPress}>
            <MaterialCommunityIcons name={rightIcon as any} size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// Default export for backward compatibility
export default TextInput

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.light,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  iconButton: {
    padding: SPACING.sm,
  },
})



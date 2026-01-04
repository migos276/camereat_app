"use client"

import type React from "react"
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Image, Alert } from "react-native"
import { useState, useCallback } from "react"
import * as ImagePicker from "expo-image-picker"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, LoadingSpinner } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface UploadDocumentsScreenProps {
  navigation: any
}

interface DocumentUpload {
  id: string
  name: string
  file?: any
  uploaded: boolean
  required: boolean
}

export const UploadDocumentsScreen: React.FC<UploadDocumentsScreenProps> = ({ navigation }) => {
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: "id_card", name: "ID Card / Passport", file: null, uploaded: false, required: true },
    { id: "driver_license", name: "Driver License", file: null, uploaded: false, required: false },
    { id: "insurance", name: "Insurance Document", file: null, uploaded: false, required: false },
  ])
  const [loading, setLoading] = useState(false)

  const handlePickImage = useCallback(async (documentId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled) {
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === documentId ? { ...doc, file: result.assets[0], uploaded: true } : doc)),
        )
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image")
    }
  }, [])

  const handleSubmit = async () => {
    const requiredUploaded = documents.filter((d) => d.required).every((d) => d.uploaded)

    if (!requiredUploaded) {
      Alert.alert("Missing Documents", "Please upload all required documents")
      return
    }

    setLoading(true)
    try {
      // API call would happen here
      setTimeout(() => {
        setLoading(false)
        navigation.navigate("VerificationStatus")
      }, 2000)
    } catch (error) {
      setLoading(false)
      Alert.alert("Error", "Failed to upload documents")
    }
  }

  return (
    <View style={styles.container}>
      <Header
        title="Upload Documents"
        subtitle="Provide clear photos of your documents"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {documents.map((doc) => (
          <Card key={doc.id} style={styles.docUploadCard}>
            <View style={styles.docHeader}>
              <Text style={styles.docTitle}>{doc.name}</Text>
              {doc.required && <Text style={styles.required}>Required</Text>}
            </View>

            {doc.uploaded && doc.file ? (
              <View style={styles.uploadedContainer}>
                <Image source={{ uri: doc.file.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.changeButton} onPress={() => handlePickImage(doc.id)}>
                  <MaterialIcons name="edit" size={20} color={COLORS.WHITE} />
                  <Text style={styles.changeButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={() => handlePickImage(doc.id)}>
                <MaterialIcons name="cloud-upload" size={40} color={COLORS.CLIENT_PRIMARY} />
                <Text style={styles.uploadText}>Tap to upload</Text>
                <Text style={styles.uploadSubtext}>or take a photo</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.docHint}>
              Make sure the document is clear and readable. All four corners must be visible.
            </Text>
          </Card>
        ))}

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for Good Photos</Text>
          {["Use good lighting", "Keep document flat", "Include all corners", "No glare or shadows"].map((tip, idx) => (
            <View key={idx} style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={18} color={COLORS.SUCCESS} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Uploading..." : "Submit Documents"}
          onPress={handleSubmit}
          color={COLORS.CLIENT_PRIMARY}
          disabled={loading}
        />
        {loading && <LoadingSpinner />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  docUploadCard: {
    marginBottom: 16,
  },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  docTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
  },
  required: {
    ...TYPOGRAPHY.caption,
    color: COLORS.ERROR,
    fontWeight: "600",
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.CLIENT_PRIMARY,
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadText: {
    ...TYPOGRAPHY.body2,
    fontWeight: "600",
    marginTop: 8,
  },
  uploadSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  uploadedContainer: {
    position: "relative",
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  changeButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.CLIENT_PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  changeButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.WHITE,
    fontWeight: "600",
  },
  docHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: "italic",
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
})

import type React from "react"
import { View, ScrollView, StyleSheet, Text } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Header, Card, Button, Badge } from "../../components"
import { COLORS, TYPOGRAPHY } from "../../constants/config"

interface DocumentsRequiredScreenProps {
  navigation: any
  route: any
}

const REQUIRED_DOCUMENTS = [
  { id: 1, name: "Identification", type: "ID Card", required: true },
  { id: 2, name: "Driver License", type: "Valid License", required: false },
  { id: 3, name: "Insurance", type: "Current Insurance", required: false },
  { id: 4, name: "Vehicle Registration", type: "Registration Card", required: false },
]

export const DocumentsRequiredScreen: React.FC<DocumentsRequiredScreenProps> = ({ navigation }) => {
  const handleStartVerification = () => {
    navigation.navigate("UploadDocuments")
  }

  return (
    <View style={styles.container}>
      <Header
        title="Complete Your Profile"
        subtitle="Upload required documents"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={24} color={COLORS.CLIENT_PRIMARY} />
            <Text style={styles.infoText}>To get started, we need to verify your identity and documents.</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Required Documents</Text>

        {REQUIRED_DOCUMENTS.map((doc) => (
          <Card key={doc.id} style={styles.docCard}>
            <View style={styles.docHeader}>
              <View style={styles.docIcon}>
                <MaterialIcons name="description" size={24} color={COLORS.WHITE} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docType}>{doc.type}</Text>
              </View>
              {doc.required && <Badge text="Required" variant="error" />}
            </View>
          </Card>
        ))}

        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Verification Process</Text>
          {[
            { step: 1, title: "Upload Documents", desc: "Submit all required documents" },
            { step: 2, title: "Review", desc: "Our team reviews your submission" },
            { step: 3, title: "Approval", desc: "Get approved and start earning" },
          ].map((item) => (
            <View key={item.step} style={styles.timelineItem}>
              <View style={[styles.timelineCircle, { backgroundColor: COLORS.CLIENT_PRIMARY }]}>
                <Text style={styles.timelineNumber}>{item.step}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>{item.title}</Text>
                <Text style={styles.timelineDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Start Verification" onPress={handleStartVerification} color={COLORS.CLIENT_PRIMARY} />
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
  infoCard: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.CLIENT_PRIMARY,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 12,
  },
  docCard: {
    marginBottom: 12,
  },
  docHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.CLIENT_PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 2,
  },
  docType: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  timeline: {
    marginTop: 32,
  },
  timelineTitle: {
    ...TYPOGRAPHY.heading3,
    fontWeight: "700",
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  timelineNumber: {
    ...TYPOGRAPHY.body1,
    color: COLORS.WHITE,
    fontWeight: "700",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineStepTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: "600",
    marginBottom: 2,
  },
  timelineDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.TEXT_SECONDARY,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
})

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '@/constants/theme';
import { useAlert } from '@/template';
import {
  fetchDashboardSections,
  generateContent,
  saveGeneratedContent,
  DashboardSection,
} from '@/services/dashboardService';

export default function SectionDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  const sectionKey = params.section as string;

  const [section, setSection] = useState<DashboardSection | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  useEffect(() => {
    loadSection();
  }, [sectionKey]);

  const loadSection = async () => {
    const { data } = await fetchDashboardSections();
    if (data) {
      const foundSection = data.find((s) => s.section_key === sectionKey);
      setSection(foundSection || null);
    }
  };

  const handleGenerate = async () => {
    if (!section) return;

    setLoading(true);
    const { data, error } = await generateContent(section.section_key, customPrompt);
    setLoading(false);

    if (error) {
      showAlert('خطأ', error);
    } else if (data) {
      setGeneratedContent(data);
      setSaveTitle(`${section.section_name_ar} - ${new Date().toLocaleDateString('ar')}`);
    }
  };

  const handleSave = async () => {
    if (!section || !generatedContent) return;

    const title = saveTitle.trim() || `${section.section_name_ar} - ${new Date().toLocaleDateString('ar')}`;

    const { error } = await saveGeneratedContent(section.id, title, generatedContent);

    if (error) {
      showAlert('خطأ', error);
    } else {
      showAlert('تم الحفظ', 'تم حفظ المحتوى بنجاح');
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generatedContent);
    showAlert('تم النسخ', 'تم نسخ المحتوى');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: generatedContent,
      });
    } catch (error: any) {
      showAlert('خطأ', error.message);
    }
  };

  if (!section) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{section.section_name_ar}</Text>
            <Text style={styles.headerSubtitle}>{section.section_name}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Custom Prompt */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>تخصيص الطلب (اختياري)</Text>
            <TextInput
              style={styles.textInput}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder="أضف تفاصيل محددة لما تريد إنشاءه..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              textAlign="right"
            />
          </View>

          {/* Generate Button */}
          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            style={({ pressed }) => [
              styles.generateButton,
              loading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={theme.colors.text} />
                <Text style={styles.generateButtonText}>جاري الإنشاء...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="auto-awesome" size={22} color={theme.colors.text} />
                <Text style={styles.generateButtonText}>إنشاء المحتوى</Text>
              </>
            )}
          </Pressable>

          {/* Generated Content */}
          {generatedContent && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>المحتوى المُنشأ</Text>
                <View style={styles.contentBox}>
                  <Text style={styles.contentText} selectable>
                    {generatedContent}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Pressable
                  onPress={handleCopy}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                >
                  <MaterialIcons name="content-copy" size={20} color={theme.colors.primary} />
                  <Text style={styles.actionButtonText}>نسخ</Text>
                </Pressable>

                <Pressable
                  onPress={handleShare}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                >
                  <MaterialIcons name="share" size={20} color={theme.colors.primary} />
                  <Text style={styles.actionButtonText}>مشاركة</Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.saveButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <MaterialIcons name="save" size={20} color={theme.colors.text} />
                  <Text style={[styles.actionButtonText, styles.saveButtonText]}>حفظ</Text>
                </Pressable>
              </View>

              {/* Save Title Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>عنوان الحفظ</Text>
                <TextInput
                  style={styles.textInput}
                  value={saveTitle}
                  onChangeText={setSaveTitle}
                  placeholder={`${section.section_name_ar} - ${new Date().toLocaleDateString('ar')}`}
                  placeholderTextColor={theme.colors.textMuted}
                  textAlign="right"
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface + 'CC',
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 80,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  generateButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  contentBox: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  contentText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.text,
  },
});

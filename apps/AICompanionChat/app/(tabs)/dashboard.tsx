import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { COMPANY } from '@/constants/company';
import { fetchDashboardSections, DashboardSection } from '@/services/dashboardService';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    const { data, error } = await fetchDashboardSections();
    if (data) {
      setSections(data);
    }
    setLoading(false);
  };

  const handleSectionPress = (section: DashboardSection) => {
    router.push(`/dashboard/${section.section_key}` as any);
  };

  const renderSection = ({ item }: { item: DashboardSection }) => (
    <Pressable
      onPress={() => handleSectionPress(item)}
      style={({ pressed }) => [
        styles.sectionCard,
        pressed && styles.sectionCardPressed,
      ]}
    >
      <View style={styles.sectionIcon}>
        <MaterialIcons name="auto-awesome" size={32} color={theme.colors.primary} />
      </View>
      <View style={styles.sectionInfo}>
        <Text style={styles.sectionNameAr}>{item.section_name_ar}</Text>
        <Text style={styles.sectionNameEn}>{item.section_name}</Text>
        {item.description && (
          <Text style={styles.sectionDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
    </Pressable>
  );

  return (
    <LinearGradient
      colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.companyNameAr}>{COMPANY.name.ar}</Text>
              <Text style={styles.tagline}>{COMPANY.tagline.ar}</Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => router.push('/dashboard/stats' as any)}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <MaterialIcons name="bar-chart" size={20} color={theme.colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/dashboard/saved' as any)}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <MaterialIcons name="folder" size={20} color={theme.colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : (
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>اختر القسم المطلوب</Text>
                <Text style={styles.listHeaderSubtext}>
                  {sections.length} أقسام متاحة
                </Text>
              </View>
            }
          />
        )}
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
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface + 'CC',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerButton: {
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  companyNameAr: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'right',
    fontWeight: theme.fonts.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  list: {
    padding: theme.spacing.xl,
  },
  listHeader: {
    marginBottom: theme.spacing.lg,
  },
  listHeaderText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
  },
  listHeaderSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sectionInfo: {
    flex: 1,
    gap: 4,
  },
  sectionNameAr: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
  },
  sectionNameEn: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
});

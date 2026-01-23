import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getSupabaseClient } from '@/template';
import { EgyptianHeader } from '@/components/EgyptianHeader';

interface Stats {
  totalContent: number;
  contentBySection: { section_name_ar: string; count: number }[];
  recentActivity: number;
  thisWeek: number;
  thisMonth: number;
}

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    // Total content
    const { count: totalContent } = await supabase
      .from('generated_content')
      .select('*', { count: 'exact', head: true });

    // Content by section
    const { data: sectionData } = await supabase
      .from('generated_content')
      .select('section_id, sections:dashboard_sections(section_name_ar)')
      .order('section_id');

    const sectionCounts: Record<string, number> = {};
    sectionData?.forEach((item: any) => {
      const sectionName = item.sections?.section_name_ar || 'غير معروف';
      sectionCounts[sectionName] = (sectionCounts[sectionName] || 0) + 1;
    });

    const contentBySection = Object.entries(sectionCounts)
      .map(([section_name_ar, count]) => ({ section_name_ar, count }))
      .sort((a, b) => b.count - a.count);

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: thisWeek } = await supabase
      .from('generated_content')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // This month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: thisMonth } = await supabase
      .from('generated_content')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    setStats({
      totalContent: totalContent || 0,
      contentBySection,
      recentActivity: thisWeek || 0,
      thisWeek: thisWeek || 0,
      thisMonth: thisMonth || 0,
    });
    setLoading(false);
  };

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
            <Text style={styles.headerTitle}>إحصائيات الاستخدام</Text>
            <Text style={styles.headerSubtitle}>تحليل شامل للمحتوى المُنتج</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Overview Cards */}
            <View style={styles.cardsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons name="folder" size={40} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{stats?.totalContent}</Text>
                <Text style={styles.statLabel}>إجمالي المحتوى</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="calendar-today" size={40} color={theme.colors.egyptian.gold} />
                <Text style={styles.statNumber}>{stats?.thisWeek}</Text>
                <Text style={styles.statLabel}>هذا الأسبوع</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="trending-up" size={40} color={theme.colors.success} />
                <Text style={styles.statNumber}>{stats?.thisMonth}</Text>
                <Text style={styles.statLabel}>هذا الشهر</Text>
              </View>
            </View>

            {/* Content by Section */}
            <EgyptianHeader title="المحتوى حسب القسم" />
            <View style={styles.section}>
              {stats?.contentBySection.map((item, index) => (
                <View key={index} style={styles.sectionItem}>
                  <View style={styles.sectionItemInfo}>
                    <Text style={styles.sectionItemName}>{item.section_name_ar}</Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(item.count / (stats.totalContent || 1)) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.sectionItemCount}>
                    <Text style={styles.sectionItemNumber}>{item.count}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <MaterialIcons name="lightbulb" size={24} color={theme.colors.egyptian.gold} />
                <Text style={styles.tipsTitle}>نصائح للاستخدام الأمثل</Text>
              </View>
              <Text style={styles.tipsText}>
                • استخدم البحث في المحفوظات للوصول السريع للمحتوى{'\n'}
                • راجع المحتوى قبل النشر للتأكد من ملاءمته{'\n'}
                • حدّث المحتوى بشكل دوري ليبقى ملائماً{'\n'}
                • استفد من جميع الأقسام لتنويع المحتوى
              </Text>
            </View>
          </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  statNumber: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  sectionItemInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  sectionItemName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'right',
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  sectionItemCount: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  sectionItemNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.egyptian.gold + '50',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.egyptian.gold,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  tipsText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    textAlign: 'right',
  },
});

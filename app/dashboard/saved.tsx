import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '@/constants/theme';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';

interface SavedContent {
  id: string;
  title: string;
  content: string;
  created_at: string;
  section_id: string;
  sections?: {
    section_name_ar: string;
  };
}

export default function SavedContentScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SavedContent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadSavedContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [searchQuery, savedContent]);

  const loadSavedContent = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('generated_content')
      .select('*, sections:dashboard_sections(section_name_ar)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading saved content:', error);
      showAlert('خطأ', 'فشل تحميل المحتوى المحفوظ');
    } else if (data) {
      setSavedContent(data);
    }
    setLoading(false);
  };

  const filterContent = () => {
    if (!searchQuery.trim()) {
      setFilteredContent(savedContent);
      return;
    }

    const filtered = savedContent.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContent(filtered);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('generated_content')
      .delete()
      .eq('id', selectedItem.id);

    setShowDeleteModal(false);
    setSelectedItem(null);

    if (error) {
      showAlert('خطأ', 'فشل حذف المحتوى');
    } else {
      showAlert('تم الحذف', 'تم حذف المحتوى بنجاح');
      loadSavedContent();
    }
  };

  const handleCopy = async (content: string) => {
    await Clipboard.setStringAsync(content);
    showAlert('تم النسخ', 'تم نسخ المحتوى');
  };

  const renderItem = ({ item }: { item: SavedContent }) => (
    <View style={styles.contentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSection}>{item.sections?.section_name_ar}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable
            onPress={() => handleCopy(item.content)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <MaterialIcons name="content-copy" size={20} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => {
              setSelectedItem(item);
              setShowDeleteModal(true);
            }}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <MaterialIcons name="delete-outline" size={20} color={theme.colors.error} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.cardContent} numberOfLines={3}>
        {item.content}
      </Text>

      <Pressable
        onPress={() => setSelectedItem(item)}
        style={({ pressed }) => [styles.viewButton, pressed && styles.viewButtonPressed]}
      >
        <Text style={styles.viewButtonText}>عرض كامل</Text>
      </Pressable>
    </View>
  );

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
            <Text style={styles.headerTitle}>المحتوى المحفوظ</Text>
            <Text style={styles.headerSubtitle}>
              {filteredContent.length} من {savedContent.length} محتوى
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ابحث في المحتوى المحفوظ..."
            placeholderTextColor={theme.colors.textMuted}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Content List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredContent}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="folder-open" size={64} color={theme.colors.textMuted} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد محتوى محفوظ'}
                </Text>
              </View>
            }
          />
        )}

        {/* View Detail Modal */}
        <Modal
          visible={selectedItem !== null && !showDeleteModal}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedItem(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setSelectedItem(null)}>
                  <MaterialIcons name="close" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedItem?.title}
                </Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalSection}>{selectedItem?.sections?.section_name_ar}</Text>
                <Text style={styles.modalDate}>
                  {selectedItem &&
                    new Date(selectedItem.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.modalText} selectable>
                  {selectedItem?.content}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => selectedItem && handleCopy(selectedItem.content)}
                  style={({ pressed }) => [
                    styles.modalButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                >
                  <MaterialIcons name="content-copy" size={20} color={theme.colors.primary} />
                  <Text style={styles.modalButtonText}>نسخ</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <MaterialIcons name="delete-outline" size={48} color={theme.colors.error} />
              <Text style={styles.deleteModalTitle}>حذف المحتوى؟</Text>
              <Text style={styles.deleteModalMessage}>
                هل أنت متأكد من حذف "{selectedItem?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
              </Text>
              <View style={styles.deleteModalButtons}>
                <Pressable
                  onPress={() => {
                    setShowDeleteModal(false);
                    setSelectedItem(null);
                  }}
                  style={({ pressed }) => [
                    styles.deleteModalButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                >
                  <Text style={styles.deleteModalButtonText}>إلغاء</Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.deleteModalButton,
                    styles.deleteModalButtonDanger,
                    pressed && styles.modalButtonPressed,
                  ]}
                >
                  <Text style={[styles.deleteModalButtonText, styles.deleteModalButtonDangerText]}>
                    حذف
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
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
    padding: theme.spacing.md,
  },
  contentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  cardHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
  },
  cardSection: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'right',
  },
  cardDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  cardContent: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
    textAlign: 'right',
  },
  viewButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  viewButtonPressed: {
    opacity: 0.7,
  },
  viewButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    gap: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
    marginRight: theme.spacing.md,
  },
  modalBody: {
    padding: theme.spacing.md,
    maxHeight: '70%',
  },
  modalSection: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
    textAlign: 'right',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  modalText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'right',
  },
  modalActions: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  deleteModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deleteModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  deleteModalMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deleteModalButtonDanger: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  deleteModalButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  deleteModalButtonDangerText: {
    color: theme.colors.text,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '@/firebase/config';
import { spacing, colors, textStyles, radius, shadows } from '@/theme';

const BODY_TEXT_COLOR = '#1C2630';

const BADGE_BEGINNER = require('../../assets/Beginner-badge.png');
const BADGE_BRONZE = require('../../assets/Bronze-badge.png');
const BADGE_SILVER = require('../../assets/Silver-badge.png');
const BADGE_GOLD = require('../../assets/Gold-badge.png');
const BADGE_DIAMOND = require('../../assets/Diamond.png');

const ICON_TRASH_BAG = require('../../assets/trash_bag.png');
const ICON_RECYCLE = require('../../assets/Recycle.png');
const ICON_BROOM = require('../../assets/Broom.png');
const ICON_HAZARD = require('../../assets/hazard.png');

const ICON_ANALYTICS = require('../../assets/analytics-icon.png');
const ICON_AI_BOT = require('../../assets/Ai-bot.png');
const ICON_LOGOUT = require('../../assets/logout.png');

const GOLD_THRESHOLD = 2500;
const DIAMOND_THRESHOLD = 5000;

const BADGE_CONFIG = [
  { asset: BADGE_BEGINNER, label: 'Beginner', threshold: 0 },
  { asset: BADGE_BRONZE, label: 'Bronze', threshold: 500 },
  { asset: BADGE_SILVER, label: 'Silver', threshold: 1000 },
  { asset: BADGE_GOLD, label: 'Gold', threshold: GOLD_THRESHOLD },
  { asset: BADGE_DIAMOND, label: 'Diamond', threshold: DIAMOND_THRESHOLD },
];

interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  points?: number;
  totalPoints?: number;
  badges?: string[];
  city?: string;
}

interface Report {
  id: string;
  note?: string;
  status?: string;
  createdAt?: any;
  category?: string;
  location?: {
    lat: number;
    lng: number;
  };
  hasPhoto?: boolean;
  hasAudio?: boolean;
}

const getBadgeLabel = (points: number) => {
  if (points >= 5000) return 'Diamond Hero';
  if (points >= 2500) return 'Gold Hero';
  if (points >= 1000) return 'Silver Hero';
  if (points >= 500) return 'Bronze Hero';
  return 'Beginner Hero';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved':
      return colors.primary;
    case 'in-progress':
      return colors.accent;
    case 'open':
      return colors.danger;
    default:
      return colors.muted;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'resolved':
      return 'Resolved';
    case 'in-progress':
      return 'In progress';
    case 'open':
      return 'Open';
    default:
      return 'Unknown';
  }
};

const getMissionProgress = (status: string) => {
  switch (status) {
    case 'resolved':
      return 1;
    case 'in-progress':
      return 0.5;
    case 'open':
      return 0.15;
    default:
      return 0.3;
  }
};

const getMissionIconSource = (report: Report) => {
  const status = report.status || 'open';

  if (report.category === 'dumping') return ICON_TRASH_BAG;
  if (report.category === 'other') return ICON_BROOM;
  if (report.category === 'hazard') return ICON_HAZARD;
  if (status === 'resolved') return ICON_RECYCLE;

  return ICON_TRASH_BAG;
};

const StatusPill = ({ status }: { status: string }) => {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: color + '26',
          borderColor: color + '80',
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
};

const getTierProgress = (points: number) => {
  if (points >= DIAMOND_THRESHOLD) {
    return {
      nextTierLabel: 'Diamond',
      progress: 1,
      remaining: 0,
    };
  }

  if (points >= GOLD_THRESHOLD) {
    const range = DIAMOND_THRESHOLD - GOLD_THRESHOLD;
    const progress = (points - GOLD_THRESHOLD) / range;
    return {
      nextTierLabel: 'Diamond',
      progress: Math.min(Math.max(progress, 0), 1),
      remaining: Math.max(DIAMOND_THRESHOLD - points, 0),
    };
  }

  return {
    nextTierLabel: 'Gold',
    progress: Math.min(points / GOLD_THRESHOLD, 1),
    remaining: Math.max(GOLD_THRESHOLD - points, 0),
  };
};

const getCurrentBadge = (points: number) => {
  return (
    [...BADGE_CONFIG]
      .filter((badge) => points >= badge.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0] || BADGE_CONFIG[0]
  );
};

function CTCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function Profile() {
  const navigation = useNavigation<any>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] =
    useState<'dumping' | 'hazard' | 'other'>('dumping');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserProfile({
            uid: docSnap.id,
            ...userData,
          } as UserProfile);
        } else {
          setUserProfile({
            uid,
            email: auth.currentUser?.email || '',
            displayName: auth.currentUser?.displayName || 'User',
            points: 0,
            totalPoints: 0,
            badges: [],
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const fetchUserReports = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setReportsLoading(true);
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('userId', '==', uid),
      );
      const querySnapshot = await getDocs(reportsQuery);
      const reports: Report[] = [];
      querySnapshot.forEach((docSnap) => {
        reports.push({ id: docSnap.id, ...docSnap.data() } as Report);
      });

      reports.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      setUserReports(reports);
    } catch (error) {
      console.error('Error fetching user reports:', error);
    } finally {
      setReportsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserReports();
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setEditNote(report.note || '');
    setEditCategory(
      (report.category as 'dumping' | 'hazard' | 'other') || 'dumping',
    );
  };

  const saveEdit = async () => {
    if (!editingReport || !editNote.trim()) return;

    try {
      const reportRef = doc(db, 'reports', editingReport.id);
      await updateDoc(reportRef, {
        note: editNote.trim(),
        category: editCategory,
        updatedAt: new Date(),
      });

      Alert.alert('Updated', 'Mission updated successfully!');
      setEditingReport(null);
      fetchUserReports();
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', 'Failed to update mission');
    }
  };

  const confirmDelete = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteModalVisible(true);
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      const reportRef = doc(db, 'reports', reportToDelete);
      await deleteDoc(reportRef);

      Alert.alert('Deleted', 'Mission removed from your history.');
      setDeleteModalVisible(false);
      setReportToDelete(null);
      fetchUserReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      Alert.alert('Error', 'Failed to delete mission');
    }
  };

  const getUserPoints = () =>
    userProfile?.totalPoints ?? userProfile?.points ?? 0;

  const getReportStats = () => {
    const openReports = userReports.filter((r) => r.status === 'open').length;
    const resolvedReports = userReports.filter(
      (r) => r.status === 'resolved',
    ).length;
    const inProgressReports = userReports.filter(
      (r) => r.status === 'in-progress',
    ).length;
    const totalReports = userReports.length;
    return { openReports, inProgressReports, resolvedReports, totalReports };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const reportStats = getReportStats();
  const totalPoints = getUserPoints();
  const { nextTierLabel, progress: tierProgress, remaining: pointsToNext } =
    getTierProgress(totalPoints);
  const currentBadge = getCurrentBadge(totalPoints);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            textStyles.body,
            { marginTop: spacing(2), color: colors.muted },
          ]}
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Eco-hero stats & missions</Text>

        <CTCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {userProfile?.photoURL ? (
              <Image
                source={{ uri: userProfile.photoURL }}
                style={styles.profileAvatar}
              />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.profileAvatarInitial}>
                  {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}

            <Text style={styles.profileName}>
              {userProfile?.displayName || 'CleanTown Hero'}
            </Text>

            {userProfile?.city && (
              <Text style={styles.profileCity}>{userProfile.city}</Text>
            )}

            <View style={styles.levelStrip}>
              <Image source={currentBadge.asset} style={styles.levelBadgeIcon} />
              <Text style={styles.levelLabel}>Eco level</Text>
              <Text style={styles.levelValue}>{totalPoints}</Text>
            </View>
          </View>

          {reportStats.totalReports > 0 && (
            <View style={styles.summaryStrip}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryStatusLabelRow}>
                  <View
                    style={[
                      styles.summaryStatusDot,
                      { backgroundColor: colors.danger },
                    ]}
                  />
                  <Text style={styles.summaryLabel}>Open</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {reportStats.openReports}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <View style={styles.summaryStatusLabelRow}>
                  <View
                    style={[
                      styles.summaryStatusDot,
                      { backgroundColor: colors.accent },
                    ]}
                  />
                  <Text style={styles.summaryLabel}>In progress</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {reportStats.inProgressReports}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <View style={styles.summaryStatusLabelRow}>
                  <View
                    style={[
                      styles.summaryStatusDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text style={styles.summaryLabel}>Resolved</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {reportStats.resolvedReports}
                </Text>
              </View>
            </View>
          )}
        </CTCard>

        <CTCard style={styles.badgesSection}>
          <Text style={styles.badgesHeading}>Eco badges</Text>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Badge track</Text>
            <Text style={styles.sectionSubtitle}>
              {getBadgeLabel(totalPoints)}
            </Text>
          </View>

          <View style={styles.badgesCardInner}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesRow}
            >
              {BADGE_CONFIG.map((badge, index) => {
                const isActive = totalPoints >= badge.threshold;

                return (
                  <View
                    key={index}
                    style={[
                      styles.badgeCard,
                      isActive
                        ? styles.badgeCardActive
                        : styles.badgeCardInactive,
                    ]}
                  >
                    <Image source={badge.asset} style={styles.badgeImage} />
                    <Text
                      style={[
                        styles.badgeLabel,
                        !isActive && styles.badgeLabelInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {badge.label}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.badgeProgressContainer}>
              <View style={styles.badgeProgressTrack}>
                <View
                  style={[
                    styles.badgeProgressFill,
                    { width: `${tierProgress * 100}%` },
                  ]}
                />
              </View>

              <Text style={styles.badgeProgressLabel}>
                {totalPoints >= DIAMOND_THRESHOLD
                  ? "You're a Diamond Hero! Max level unlocked."
                  : `${pointsToNext} pts to reach ${nextTierLabel} Hero`}
              </Text>
            </View>
          </View>
        </CTCard>

        <CTCard style={styles.toolsSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Tools</Text>
            </View>
          </View>

          <View style={styles.mediaButtonsRow}>
            <Pressable
              onPress={() => navigation.navigate('Analytics' as never)}
              style={[styles.photoButton, styles.photoButtonAnalytics]}
            >
              <Image source={ICON_ANALYTICS} style={styles.mediaIcon} />
              <Text style={styles.photoButtonLabel}>Eco analytics</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('AITest' as never)}
              style={[styles.photoButton, styles.photoButtonAI]}
            >
              <Image source={ICON_AI_BOT} style={styles.mediaIcon} />
              <Text style={styles.photoButtonLabel}>AI assistant</Text>
            </Pressable>
          </View>
        </CTCard>

        <View style={{ marginBottom: spacing(4) }}>
          <Text style={styles.cherrySectionHeader}>
            My missions ({userReports.length})
          </Text>

          {reportsLoading && (
            <View style={{ alignItems: 'flex-end', marginBottom: spacing(1) }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          <View style={styles.missionsList}>
            {userReports.length === 0 ? (
              <View style={styles.emptyReports}>
                <Text style={styles.emptyReportsTitle}>No missions yet</Text>
                <Text style={styles.emptyReportsText}>
                  Start your first cleanup mission to see it here.
                </Text>
              </View>
            ) : (
              userReports.map((report) => {
                const status = report.status || 'open';
                const progress = getMissionProgress(status);

                return (
                  <View key={report.id} style={styles.missionCard}>
                    <View style={styles.missionIconBubble}>
                      <Image
                        source={getMissionIconSource(report)}
                        style={styles.missionIconImage}
                      />
                    </View>

                    <View style={styles.missionTextCol}>
                      <Text style={styles.missionTitle}>
                        {report.category || 'Mission'}
                      </Text>
                      <Text
                        style={styles.missionNote}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {report.note || 'No note added yet'}
                      </Text>

                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.round(progress * 100)}%` },
                          ]}
                        />
                      </View>

                      <Text style={styles.progressLabel}>
                        {status === 'resolved'
                          ? 'Mission complete'
                          : status === 'in-progress'
                          ? 'Halfway there'
                          : 'Just getting started'}
                      </Text>
                    </View>

                    <View style={styles.missionRightCol}>
                      <StatusPill status={status} />
                      <Text style={styles.missionDate}>
                        {formatDate(report.createdAt)}
                      </Text>

                      <View style={styles.missionActionsRow}>
                        <Pressable
                          onPress={() => handleEditReport(report)}
                          style={[
                            styles.iconActionButton,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons name="pencil" size={16} color="#ffffff" />
                        </Pressable>

                        <Pressable
                          onPress={() => confirmDelete(report.id)}
                          style={[
                            styles.iconActionButton,
                            { backgroundColor: colors.danger },
                          ]}
                        >
                          <Image
                            source={ICON_TRASH_BAG}
                            style={{
                              width: 20,
                              height: 20,
                              resizeMode: 'contain',
                            }}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Image
            source={ICON_LOGOUT}
            style={styles.signOutIcon}
            resizeMode="contain"
          />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Modal
          visible={!!editingReport}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingReport(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit mission</Text>

              <Text style={styles.modalLabel}>Mission type</Text>
              <View style={styles.modalCategoryRow}>
                {(['dumping', 'hazard', 'other'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setEditCategory(cat)}
                    style={[
                      styles.modalCategoryButton,
                      editCategory === cat && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalCategoryText,
                        {
                          color:
                            editCategory === cat ? '#fff' : BODY_TEXT_COLOR,
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Mission briefing *</Text>
              <TextInput
                value={editNote}
                onChangeText={setEditNote}
                style={styles.modalInput}
                multiline
                numberOfLines={5}
                placeholder="Describe your cleanup mission..."
                placeholderTextColor={BODY_TEXT_COLOR + '55'}
              />

              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => setEditingReport(null)}
                  style={styles.modalCancelButton}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={saveEdit}
                  disabled={!editNote.trim()}
                  style={[
                    styles.modalSaveButton,
                    !editNote.trim() && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.modalSaveText}>Save changes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* DELETE CONFIRM MODAL */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, styles.deleteCard]}>
              <Text style={styles.modalTitle}>Delete mission</Text>

              <Text style={styles.deleteText}>
                Are you sure you want to delete this mission report? This
                action cannot be undone.
              </Text>

              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => setDeleteModalVisible(false)}
                  style={styles.modalCancelButton}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleDeleteReport}
                  style={[
                    styles.modalSaveButton,
                    { backgroundColor: colors.danger },
                  ]}
                >
                  <Text style={styles.modalSaveText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },
  scrollContent: {
    paddingHorizontal: spacing(3),
    paddingTop: spacing(4),
    paddingBottom: spacing(5),
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gradientStart,
  },
  card: {
    backgroundColor: '#f2f2fdff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#C8ECF4',
    paddingVertical: spacing(2.2),
    paddingHorizontal: spacing(2.5),
    marginBottom: spacing(2),
    ...shadows.sm,
  },

  title: {
    fontFamily: 'CherryBomb-One',
    fontSize: 32,
    color: '#2A7390',
    textAlign: 'center',
    marginBottom: spacing(0.5),
  },
  subtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing(3),
  },

  profileCard: {},
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing(2),
    borderWidth: 4,
    borderColor: colors.primary,
  },
  profileAvatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(2),
    borderWidth: 4,
    borderColor: colors.primary,
  },
  profileAvatarInitial: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#ffffff',
  },
  profileName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.ink,
    marginBottom: spacing(0.5),
    textAlign: 'center',
  },
  profileCity: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing(1.5),
    textAlign: 'center',
  },
  levelStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1),
  },
  levelBadgeIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: spacing(1),
  },
  levelLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginRight: spacing(1),
  },
  levelValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1C2530',
  },

  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#C8ECF4',
    borderRadius: 18,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    marginTop: spacing(1),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: BODY_TEXT_COLOR,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1C2530',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: BODY_TEXT_COLOR,
    opacity: 0.25,
    marginHorizontal: spacing(1.5),
    borderRadius: 999,
  },
  summaryStatusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  badgesSection: {
    marginTop: spacing(1),
  },
  badgesHeading: {
    fontFamily: 'CherryBomb-One',
    fontSize: 18,
    color: '#2A7390',
    marginBottom: spacing(1),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1.5),
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: colors.ink,
  },
  sectionSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: BODY_TEXT_COLOR,
  },

  badgesCardInner: {},
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    marginBottom: spacing(2),
  },
  badgeCard: {
    width: 71,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(1),
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeCardActive: {
    backgroundColor: 'rgba(114,197,93,0.22)',
    borderColor: colors.primary,
  },
  badgeCardInactive: {
    opacity: 0.5,
  },
  badgeImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: spacing(0.5),
  },
  badgeLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: BODY_TEXT_COLOR,
  },
  badgeLabelInactive: {
    color: BODY_TEXT_COLOR + '99',
  },
  badgeProgressContainer: {
    marginTop: spacing(1),
  },
  badgeProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.card,
    overflow: 'hidden',
    marginBottom: spacing(0.5),
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  badgeProgressLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: BODY_TEXT_COLOR,
  },

  toolsSection: {
    marginTop: spacing(2),
  },

  sectionTitle: {
  ...textStyles.h3,       
  fontSize: 16,         
  color: colors.ink,
},
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing(0.5),
  },

  mediaButtonsRow: {
    flexDirection: 'row',
    gap: spacing(1.5),
    marginTop: spacing(1.5),
    marginBottom: spacing(1),
  },
  photoButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing(1.8),
    alignItems: 'center',
    ...shadows.sm,
  },
  photoButtonAnalytics: {
    backgroundColor: colors.hotspots,
  },
  photoButtonAI: {
    backgroundColor: colors.leaderboard,
  },
 mediaIcon: {
  width: 38, 
  height: 38,        
  resizeMode: 'contain',
  marginBottom: 6, 
},

photoButtonLabel: {
  ...textStyles.bodySmall,
  fontFamily: 'Poppins-SemiBold',
  fontSize: 12,     
  color: colors.ink,
},


  cherrySectionHeader: {
    fontFamily: 'CherryBomb-One',
    fontSize: 20,
    color: '#2A7390',
    marginBottom: spacing(2),
  },
  missionsList: {},
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: spacing(1),
  },
  statusPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },

  emptyReports: {
    padding: spacing(4),
    alignItems: 'center',
  },
  emptyReportsTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    marginBottom: spacing(1),
    textAlign: 'center',
    color: colors.ink,
  },
  emptyReportsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: BODY_TEXT_COLOR,
    textAlign: 'center',
  },

  missionCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: spacing(2.5),
    backgroundColor: '#f2f2fdff',
    borderWidth: 1,
    borderColor: '#C8ECF4',
    marginBottom: spacing(2),
  },
  missionIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(2),
  },
  missionIconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  missionTextCol: {
    flex: 1,
  },
  missionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: BODY_TEXT_COLOR,
    marginBottom: 2,
  },
  missionNote: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: BODY_TEXT_COLOR,
    marginBottom: spacing(1),
  },
  progressLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: BODY_TEXT_COLOR,
  },
  missionDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: BODY_TEXT_COLOR,
    marginTop: spacing(0.5),
    marginBottom: spacing(1),
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.card,
    overflow: 'hidden',
    marginBottom: spacing(0.5),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  missionRightCol: {
    alignItems: 'flex-end',
    marginLeft: spacing(1.5),
  },
  missionActionsRow: {
    flexDirection: 'row',
    gap: spacing(1),
  },
  iconActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  signOutButton: {
    alignSelf: 'center',
    marginTop: spacing(1),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(1.5),
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#72C55D',
    marginBottom: spacing(2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'Poppins_900SemiBold',
    fontSize: 14,
    color: '#1C2530',
    textAlign: 'center',
  },
  signOutIcon: {
    width: 22,
    height: 22,
    marginRight: spacing(1.5),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing(3),
  },
  modalCard: {
    backgroundColor: '#C8ECF4',
    padding: spacing(3),
    borderRadius: radius.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  modalTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 24,
    color: '#2A7390',
    textAlign: 'center',
    marginBottom: spacing(0.5),
  },
  modalLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    marginBottom: spacing(1.5),
    color: BODY_TEXT_COLOR,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    marginBottom: spacing(2),
  },
  modalCategoryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: spacing(1.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '22',
    marginRight: spacing(1),
  },
  modalCategoryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'capitalize',
    color: BODY_TEXT_COLOR,
  },
  modalInput: {
    backgroundColor: '#ffffff',
    padding: spacing(2.5),
    borderRadius: radius.lg,
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: BODY_TEXT_COLOR,
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(1),
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#C8ECF4',
    paddingVertical: spacing(1.5),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.muted,
    marginRight: spacing(1),
  },
  modalCancelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    color: BODY_TEXT_COLOR,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing(1.5),
    borderRadius: radius.lg,
    marginLeft: spacing(1),
  },
  modalSaveText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  deleteCard: {
    borderColor: colors.danger + '22',
  },
  deleteText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: BODY_TEXT_COLOR,
    textAlign: 'center',
    marginBottom: spacing(3),
    lineHeight: 20,
  },
});

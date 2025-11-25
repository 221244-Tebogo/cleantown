import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { colors, spacing, shadows, textStyles, radius } from '@/theme';

const BADGE_BEGINNER = require('../../assets/Beginner-badge.png');
const BADGE_BRONZE = require('../../assets/Bronze-badge.png');
const BADGE_SILVER = require('../../assets/Silver-badge.png');
const BADGE_GOLD = require('../../assets/Gold-badge.png');
const BADGE_DIAMOND = require('../../assets/Diamond.png');

const BADGE_TIERS = [
  { threshold: 0, label: 'Beginner', asset: BADGE_BEGINNER },
  { threshold: 500, label: 'Bronze', asset: BADGE_BRONZE },
  { threshold: 1000, label: 'Silver', asset: BADGE_SILVER },
  { threshold: 2500, label: 'Gold', asset: BADGE_GOLD },
  { threshold: 5000, label: 'Diamond', asset: BADGE_DIAMOND },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LeaderboardUser {
  uid: string;
  displayName?: string;
  photoURL?: string;
  points?: number;
  totalPoints?: number;
  city?: string;
  rank?: number;
}

type LeaderboardTab = 'global' | 'local' | 'friends';

const HERO_IMAGE = require('../../assets/celebrate.png');
const SHIELD_IMAGE = require('../../assets/cleantown-hero-shield.png');
const GOLD_BADGE = require('../../assets/Gold-badge.png');
const SILVER_BADGE = require('../../assets/Silver-badge.png');
const BRONZE_BADGE = require('../../assets/Bronze-badge.png');

const getTierForPoints = (points = 0) =>
  [...BADGE_TIERS]
    .filter((badge) => points >= badge.threshold)
    .sort((a, b) => b.threshold - a.threshold)[0] ?? BADGE_TIERS[0];

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [currentUserPoints, setCurrentUserPoints] = useState<number | null>(null);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<{
    label: string;
    asset: any;
  } | null>(null);

  const lastTierRef = useRef<{ label: string; threshold: number } | null>(null);
  const hasInitialSnapshotRef = useRef(false);

  useEffect(() => {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('totalPoints', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (querySnapshot) => {
        const leaderboardData: LeaderboardUser[] = [];

        querySnapshot.forEach((docSnap, index) => {
          const userData = docSnap.data();
          leaderboardData.push({
            uid: docSnap.id,
            displayName: userData.displayName || 'Anonymous Hero',
            photoURL: userData.photoURL,
            points: userData.points || 0,
            totalPoints: userData.totalPoints || userData.points || 0,
            city: userData.city,
            rank: index + 1,
          });
        });

        const rankedUsers = leaderboardData.map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

        setUsers(rankedUsers);
        setLoading(false);
        setRefreshing(false);

        const currentUserId = auth.currentUser?.uid;
        if (currentUserId) {
          const currentUserIndex = rankedUsers.findIndex(
            (user) => user.uid === currentUserId
          );
          setCurrentUserRank(currentUserIndex + 1);

          const currentUser = rankedUsers[currentUserIndex];

          if (currentUser) {
            const total = currentUser.totalPoints ?? 0;
            const newTier = getTierForPoints(total);

            if (hasInitialSnapshotRef.current && lastTierRef.current) {
              if (newTier.threshold > lastTierRef.current.threshold) {
                // ⭐ LEVEL UP detected – show big badge modal
                setUnlockedBadge({ label: newTier.label, asset: newTier.asset });
                setShowLevelUpModal(true);
              }
            }

            lastTierRef.current = {
              label: newTier.label,
              threshold: newTier.threshold,
            };
            hasInitialSnapshotRef.current = true;
          }
        }
      },
      (error) => {
        console.error('Leaderboard error:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setCurrentUserPoints(null);
      return;
    }

    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const total =
        (data.totalPoints as number | undefined) ??
        (data.points as number | undefined) ??
        0;
      setCurrentUserPoints(total);
    });

    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const getCurrentUser = () =>
    users.find((user) => user.uid === auth.currentUser?.uid);

  const getRankChangeIcon = (user: LeaderboardUser) => {
    const currentUserId = auth.currentUser?.uid;
    if (user.uid === currentUserId) {
      return '▲';
    }
    return '';
  };

  const getBadgeForPoints = (points = 0) => {
    if (points >= 5000) return BADGE_DIAMOND;
    if (points >= 2500) return BADGE_GOLD;
    if (points >= 1000) return BADGE_SILVER;
    if (points >= 500) return BADGE_BRONZE;
    return BADGE_BEGINNER;
  };

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
          Loading leaderboard...
        </Text>
      </View>
    );
  }

  const currentUser = getCurrentUser();
  const pillPoints =
    currentUser?.totalPoints ?? currentUserPoints ?? currentUser?.points ?? 0;
  const topThree = users.slice(0, 3);

  const podiumOrder = [1, 0, 2];

  const badgeByRank: Record<number, any> = {
    1: GOLD_BADGE,
    2: SILVER_BADGE,
    3: BRONZE_BADGE,
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <Image
            source={HERO_IMAGE}
            style={styles.heroImage}
            resizeMode="contain"
          />

          {auth.currentUser && (
            <View style={styles.pointsPill}>
              <Image
                source={getBadgeForPoints(pillPoints)}
                style={styles.pointsPillIcon}
                resizeMode="contain"
              />
              <Text style={styles.pointsPillText}>
                {pillPoints.toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>Leaderboard</Text>

        {topThree.length > 0 && (
          <View style={styles.podiumRow}>
            {podiumOrder
              .filter((index) => topThree[index])
              .map((index, visualIndex) => {
                const user = topThree[index];

                const cardHeights = [160, 190, 150];
                const colorsByIndex = ['#D8D8D8', '#DAA520', '#CE8946'];

                const badgeSource = badgeByRank[user.rank ?? 0] || undefined;
                const cardHeight = cardHeights[visualIndex];
                const bgColor = colorsByIndex[visualIndex];

                return (
                  <View key={user.uid} style={styles.podiumSlot}>
                    <View
                      style={[
                        styles.podiumCard,
                        {
                          height: cardHeight,
                          backgroundColor: bgColor,
                        },
                      ]}
                    >
                      <View style={styles.podiumAvatarWrapper}>
                        {user.photoURL ? (
                          <Image
                            source={{ uri: user.photoURL }}
                            style={styles.podiumAvatar}
                          />
                        ) : (
                          <View style={styles.podiumAvatarPlaceholder}>
                            <Text style={styles.podiumAvatarInitial}>
                              {user.displayName?.charAt(0)?.toUpperCase() ??
                                '?'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={styles.podiumName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {user.displayName}
                      </Text>

                      {badgeSource && (
                        <Image
                          source={badgeSource}
                          style={styles.podiumBadge}
                          resizeMode="contain"
                        />
                      )}

                      <View style={styles.podiumScorePill}>
                        <Text style={styles.podiumScoreLabel}>Score</Text>
                        <Text style={styles.podiumScoreValue}>
                          {user.totalPoints ?? 0}
                        </Text>
                      </View>

                      <View style={styles.podiumRankTag}>
                        <Text style={styles.podiumRankText}>{user.rank}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        <View style={styles.tabsContainer}>
          {(['global', 'local', 'friends'] as LeaderboardTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.listCard}>
          {users.slice(3).map((user, index) => {
            const rowBadgeSource = badgeByRank[user.rank ?? 0] || undefined;

            return (
              <Pressable
                key={user.uid}
                style={({ pressed }) => [
                  styles.listRow,
                  user.uid === auth.currentUser?.uid &&
                    styles.listRowCurrentUser,
                  index < users.slice(3).length - 1 &&
                    styles.listRowDivider,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.rankCol}>
                  <Text style={styles.rankText}>{user.rank}</Text>
                </View>

                {user.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.rowAvatar}
                  />
                ) : (
                  <View style={styles.rowAvatarPlaceholder}>
                    <Text style={styles.rowAvatarInitial}>
                      {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}

                <View style={styles.nameCol}>
                  <Text
                    style={styles.nameText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {user.displayName}
                  </Text>
                </View>

                {rowBadgeSource && (
                  <Image
                    source={rowBadgeSource}
                    style={styles.rowBadge}
                    resizeMode="contain"
                  />
                )}

                <View style={styles.pointsCol}>
                  <Text style={styles.pointsText}>
                    {user.totalPoints ?? 0}
                  </Text>
                  <Text style={styles.pointsChangeText}>
                    {getRankChangeIcon(user)}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {users.length === 0 && (
            <View className="emptyState">
              <Text style={{ fontSize: 64, marginBottom: spacing(3) }}></Text>
              <Text
                style={[
                  textStyles.h3,
                  { marginBottom: spacing(2), textAlign: 'center' },
                ]}
              >
                No Heroes Yet
              </Text>
              <Text
                style={[
                  textStyles.body,
                  { color: colors.muted, textAlign: 'center' },
                ]}
              >
                Be the first to earn points and appear on the leaderboard!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
  visible={showLevelUpModal && !!unlockedBadge}
  transparent={false}      
  animationType="fade"
  onRequestClose={() => setShowLevelUpModal(false)}
>
  <View style={styles.levelScreen}>
    {showLevelUpModal && (
      <View style={styles.confettiOverlay} pointerEvents="none">
        <ConfettiCannon
          count={140}
          origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
          fadeOut
          explosionSpeed={350}
          fallSpeed={3000}
        />
      </View>
    )}

    <Image source={HERO_IMAGE} style={styles.levelMascot} resizeMode="contain" />
    <Text style={styles.levelTitle}>Congratulations</Text>
    <Text style={styles.levelSubtitle}>Level unlocked!</Text>

    {unlockedBadge && (
      <Image
        source={unlockedBadge.asset}
        style={styles.levelBadgeBig}
        resizeMode="contain"
      />
    )}

    <View style={styles.levelProgressWrapper}>
      <View style={styles.levelProgressTrack}>
        <View style={styles.levelProgressFill} />
      </View>
      <Text style={styles.levelLabelText}>
        {unlockedBadge?.label} Level
      </Text>
    </View>

    <Pressable
      style={styles.levelButton}
      onPress={() => setShowLevelUpModal(false)}
    >
      <Text style={styles.levelButtonText}>Continue</Text>
    </Pressable>
  </View>
</Modal>

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

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
  },
  heroImage: {
    width: 140,
    height: 120,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pointsBackground,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 999,
    gap: spacing(1),
  },
  pointsPillIcon: {
    width: 34,
    height: 34,
  },
  pointsPillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.ink,
  },

  title: {
    fontFamily: 'CherryBomb-One',
    fontSize: 36,
    color: '#2A7390',
    textAlign: 'center',
    marginBottom: spacing(3),
  },

  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing(4),
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
  },
  podiumCard: {
    width: '88%',
    borderRadius: 22,
    paddingTop: spacing(5),
    paddingHorizontal: spacing(1.5),
    paddingBottom: spacing(2.5),
    alignItems: 'center',
    justifyContent: 'flex-end',
    ...shadows.lg,
  },
  podiumAvatarWrapper: {
    position: 'absolute',
    top: spacing(-3),
    alignSelf: 'center',
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: '#FFEFA9',
  },
  podiumAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFEFA9',
  },
  podiumAvatarInitial: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
  },
  podiumName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#1D2654',
    marginBottom: spacing(1),
  },
  podiumBadge: {
    width: 42,
    height: 42,
    marginBottom: spacing(1),
  },
  podiumScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF6E9',
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
    marginBottom: spacing(1.5),
  },
  podiumScoreLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#3e29c4ff',
    marginRight: spacing(0.5),
  },
  podiumScoreValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#C45A29',
  },
  podiumRankTag: {
    position: 'absolute',
    bottom: spacing(-1.5),
    alignSelf: 'center',
    backgroundColor: '#FDD53B',
    borderRadius: 999,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderWidth: 2,
    borderColor: '#F5991C',
  },
  podiumRankText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#884004',
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2D8A2E',
    borderRadius: 999,
    padding: spacing(0.5),
    marginBottom: spacing(4),
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing(1.5),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#E7F6E7',
  },
  tabTextActive: {
    color: '#2D8A2E',
  },

  listCard: {
    backgroundColor: '#FDFDF2',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3),
  },
  listRowCurrentUser: {
    backgroundColor: colors.leaderboard,
  },
  listRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
    marginRight: spacing(1),
  },
  rankText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.ink,
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing(2),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rowAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing(2),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowAvatarInitial: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },

  nameCol: {
    flex: 1,
  },
  nameText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.ink,
  },
  rowBadge: {
    width: 24,
    height: 24,
    marginHorizontal: spacing(1),
  },
  pointsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing(1),
  },
  pointsText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.ink,
    marginRight: spacing(1),
  },
  pointsChangeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },

  emptyState: {
    padding: spacing(6),
    alignItems: 'center',
    justifyContent: 'center',
  },

  levelScreen: {
    flex: 1,
    backgroundColor: colors.gradientStart,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing(5),
    paddingBottom: spacing(6),
    paddingHorizontal: spacing(3),
  },

  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  levelMascot: {
    width: 90,
    height: 90,
    marginTop: spacing(1),
  },
  levelTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 28,
    color: '#114567',
    textAlign: 'center',
  },
  levelSubtitle: {
    ...textStyles.bodySmall,
    color: '#F59E0B',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginTop: spacing(0.5),
  },
  levelBadgeBig: {
    width: 220,
    height: 220,
    marginVertical: spacing(2),
  },
  levelProgressWrapper: {
    width: '80%',
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  levelProgressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
    overflow: 'hidden',
    marginBottom: spacing(1),
  },
  levelProgressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: '#72C55D',
  },
  levelLabelText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#72C55D',
  },
  levelButton: {
    width: '80%',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: spacing(1.6),
    alignItems: 'center',
    ...shadows.lg,
  },
  levelButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#2D8A2E',
  },
});

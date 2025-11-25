import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

import { db } from '@/firebase/config';
import { geminiAI } from '@/services/geminiAI';
import { colors, spacing, textStyles, radius, shadows } from '@/theme';

// ICONS
const ICON_BOT = require('../../assets/Ai-bot.png');
const ICON_EMPTY = require('../../assets/analytics-icon.png');

const ICON_MISSIONS = require('../../assets/mascot_celebrate.png');
const ICON_HOTSPOTS = require('../../assets/cleantown-hero-shield.png');
const ICON_RISK = require('../../assets/emergency_alert.png');
const ICON_TREND = require('../../assets/cleantown-recycling.png');

const ICON_HOTSPOT_SMALL = require('../../assets/green_map.png');
const ICON_MATERIAL = require('../../assets/Recycle.png');
const ICON_TIME = require('../../assets/clock_orange.png');
const ICON_LOCATION = require('../../assets/location.png');

const MISSIONS_PER_LEVEL = 10;
const LEVEL_TITLES = [
  'Rookie Recycler',
  'Neighborhood Scout',
  'Cleanup Captain',
  'Eco Guardian',
  'City Legend',
];
const BADGE_TRACKS = ['Explorer', 'Defender', 'Legend'];

const cleanSummary = (raw: string | undefined | null): string => {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
};

export default function AnalyticsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingReports, setFetchingReports] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const navigation = useNavigation();
  const isBusy = loading || fetchingReports;

  const fetchReports = async () => {
    setFetchingReports(true);
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(reportsQuery);

      const reportsData = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          location: data.location || { lat: 0, lng: 0 },
          timestamp:
            data.createdAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
          severity: data.aiAnalysis?.severity || 'medium',
          materials: data.aiAnalysis?.materials || ['mixed waste'],
          category: data.category || 'other',
          description: data.note || '',
          ...data,
        };
      });

      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setFetchingReports(false);
    }
  };

  const analyzeHotspots = async () => {
    if (!reports.length) {
      setPatternAnalysis(null);
      return;
    }

    if (!geminiAI.isAIAvailable()) {
      Alert.alert('AI Offline', 'CleanTown AI is not available right now.');
      return;
    }

    setLoading(true);
    try {
      const analysis = await geminiAI.analyzeHotspots(reports);

      const safeAnalysis = {
        ...analysis,
        summary: cleanSummary(analysis.summary),
      };

      setPatternAnalysis(safeAnalysis);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Hotspot analysis failed:', error);
      Alert.alert('Analysis failed', 'Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchReports();
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (reports.length > 0) analyzeHotspots();
    else setPatternAnalysis(null);
  }, [reports.length]);

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}(${encodeURIComponent(name)})`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(name)})`,
    });

    if (url)
      Linking.openURL(url).catch(() =>
        Alert.alert('Cannot open Maps', 'Install a maps app.')
      );
  };

const viewOnMap = (hotspot: any) => {
  navigation.navigate(
    'MainTabs' as never,
    {
      screen: 'MapShare',
      params: {
        focusedLocation: {
          latitude: hotspot.coordinates.lat,
          longitude: hotspot.coordinates.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        hotspotData: hotspot,
      },
    } as never
  );
};


  const getAreaName = (lat: number, lng: number) => {
    if (lat === 0 && lng === 0) return 'Unknown location';
    if (lat > -26 && lat < -25 && lng > 27 && lng < 28.5) return 'Johannesburg';
    if (lat > -33.9 && lat < -33.8 && lng > 18.4 && lng < 18.6) return 'Cape Town';
    if (lat > -29.8 && lat < -29.6 && lng > 30.9 && lng < 31.1) return 'Durban';
    return `Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const { level, currentXP, nextLevelXP, progress } = getLevelInfo(reports.length);

  const missions = reports.length;
  const missionLevel = level;
  const missionsIntoLevel = currentXP;
  const isLevelUpReady = missions > 0 && missionsIntoLevel === 0;
  const xpPercent = progress;

  const missionsToNext =
    !missions || isLevelUpReady
      ? MISSIONS_PER_LEVEL
      : MISSIONS_PER_LEVEL - missionsIntoLevel;

  const levelTitle =
    LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, missionLevel - 1)];

  const heroMissionLabel = `${missions} mission${missions === 1 ? '' : 's'}`;
  const heroSubtitle = !missions
    ? 'Log missions to unlock more insights.'
    : isLevelUpReady
    ? 'You’re ready to level up with your next mission.'
    : `${missionsToNext} mission${missionsToNext === 1 ? '' : 's'} until Level ${
        missionLevel + 1
      }`;

  const topMaterial =
    patternAnalysis?.materialTrends?.[0]?.material || 'mixed waste';
  const trackedHotspots = patternAnalysis?.hotspots.length ?? 0;

  const highRiskHotspots =
    patternAnalysis?.hotspots?.filter(
      (h: any) => h.severity === 'high'
    ).length || 0;

  const trendLabel = patternAnalysis?.overallTrend
    ? String(patternAnalysis.overallTrend).toUpperCase()
    : 'NEUTRAL';

  const badgeStates = BADGE_TRACKS.map((label, idx) => ({
    label,
    unlocked: idx < Math.min(BADGE_TRACKS.length, Math.ceil(trackedHotspots / 2)),
  }));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics HQ</Text>
        <Text style={styles.subtitle}>
          Track your city like a pro eco-hero
        </Text>

        <Pressable
          onPress={refreshData}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.refreshText}>↻ Sync</Text>
        </Pressable>

        <Text style={styles.metaText}>
          {reports.length} missions logged •{' '}
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not analysed yet'}
        </Text>
      </View>

      {isBusy && (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {fetchingReports ? 'Loading missions…' : 'CleanTown AI is analysing patterns…'}
          </Text>
        </View>
      )}

      {!isBusy && !patternAnalysis && reports.length === 0 && (
        <View style={styles.emptyState}>
          <Image source={ICON_EMPTY} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No analytics yet</Text>
          <Text style={styles.emptyBody}>
            Log a few cleanup missions to unlock your analytics dashboard.
          </Text>
        </View>
      )}

  
      {patternAnalysis && !isBusy && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
         
          <View style={styles.heroCard}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroBadge}>CleanTown League • {levelTitle}</Text>
              <Text style={styles.heroTitle}>Eco Level {level}</Text>
              <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>

              <View style={styles.xpBarBackground}>
                <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
              </View>
              <Text style={styles.xpLabel}>
                {currentXP}/{nextLevelXP} missions this level • {heroMissionLabel}
              </Text>

              <View style={styles.badgeRow}>
                {badgeStates.map((badge) => (
                  <View
                    key={badge.label}
                    style={[
                      styles.badgeChip,
                      badge.unlocked && styles.badgeChipUnlocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeChipText,
                        badge.unlocked && styles.badgeChipTextUnlocked,
                      ]}
                    >
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.heroRight}>
              <Image source={ICON_BOT} style={styles.heroBot} />
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>AI hotspot scanner: ON</Text>
              </View>
              <View style={styles.trendSmallRow}>
                <Image source={ICON_TREND} style={styles.trendIcon} />
                <Text style={styles.heroTrendText}>Trend: {trendLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeaderRow}>
                <Image source={ICON_MISSIONS} style={styles.statIcon} />
                <Text style={styles.statLabel}>Missions logged</Text>
              </View>
              <Text style={styles.statValue}>{reports.length}</Text>
              <Text style={styles.statHint}>Your total cleanup activity.</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeaderRow}>
                <Image source={ICON_HOTSPOTS} style={styles.statIcon} />
                <Text style={styles.statLabel}>Active hotspots</Text>
              </View>
              <Text style={styles.statValue}>
                {patternAnalysis.hotspots.length}
              </Text>
              <Text style={styles.statHint}>Problem areas tracked by AI.</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeaderRow}>
                <Image source={ICON_RISK} style={styles.statIcon} />
                <Text style={styles.statLabel}>High-risk zones</Text>
              </View>
              <Text style={styles.statValue}>{highRiskHotspots}</Text>
              <Text style={styles.statHint}>Marked as high severity.</Text>
            </View>

            <View style={[styles.statCard, styles.statCardFull]}>
              <View style={styles.statHeaderRow}>
                <Image source={ICON_TREND} style={styles.statIcon} />
                <Text style={styles.statLabel}>Overall trend</Text>
              </View>
              <View style={styles.trendRow}>
                <View
                  style={[
                    styles.trendPill,
                    patternAnalysis.overallTrend === 'improving' &&
                      styles.trendGood,
                    patternAnalysis.overallTrend === 'worsening' &&
                      styles.trendBad,
                  ]}
                >
                  <Text style={styles.trendText}>{trendLabel}</Text>
                </View>
                <Text style={styles.trendCaption}>
                  Based on recent missions and hotspot patterns.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI overview</Text>
            <Text style={styles.summaryText}>{patternAnalysis.summary}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>
                Hotspot zones ({patternAnalysis.hotspots.length})
              </Text>
              <Image source={ICON_HOTSPOT_SMALL} style={styles.cardHeaderIcon} />
            </View>

            {patternAnalysis.hotspots.map((hotspot: any) => (
              <Pressable
                key={hotspot.id}
                style={styles.hotspotItem}
                onPress={() => viewOnMap(hotspot)}
              >
                <View style={styles.hotspotHeader}>
                  <View style={styles.hotspotInfo}>
                    <Text style={styles.hotspotName}>{hotspot.name}</Text>
                    <View style={styles.hotspotLocationRow}>
                      <Image source={ICON_LOCATION} style={styles.locationIcon} />
                      <Text style={styles.hotspotLocation}>
                        {getAreaName(
                          hotspot.coordinates.lat,
                          hotspot.coordinates.lng
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.severityDot,
                      hotspot.severity === 'high' && styles.severityHigh,
                      hotspot.severity === 'medium' && styles.severityMedium,
                      hotspot.severity === 'low' && styles.severityLow,
                    ]}
                  />
                </View>

                <View style={styles.hotspotChipsRow}>
                  <View style={styles.hotspotChip}>
                    <Text style={styles.hotspotChipText}>
                      {hotspot.reportCount} missions logged
                    </Text>
                  </View>
                  <View style={styles.hotspotChip}>
                    <Image source={ICON_MATERIAL} style={styles.materialIcon} />
                    <Text style={styles.hotspotChipText}>
                      {hotspot.commonMaterials.join(', ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.hotspotFooterRow}>
                  <View style={styles.hotspotTimeRow}>
                    <Image source={ICON_TIME} style={styles.timeIcon} />
                    <Text style={styles.hotspotTime}>
                      Last report:{' '}
                      {hotspot.lastReported?.toLocaleDateString
                        ? hotspot.lastReported.toLocaleDateString()
                        : String(hotspot.lastReported)}
                    </Text>
                  </View>

                  <View style={styles.hotspotActions}>
                    <Pressable
                      style={styles.mapButton}
                      onPress={() => viewOnMap(hotspot)}
                    >
                      <Text style={styles.mapButtonText}>View on map</Text>
                    </Pressable>
                    <Pressable
                      style={styles.directionsButton}
                      onPress={() =>
                        openInMaps(
                          hotspot.coordinates.lat,
                          hotspot.coordinates.lng,
                          hotspot.name
                        )
                      }
                    >
                      <Text style={styles.directionsButtonText}>
                        Directions
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Patterns & timing</Text>
              <Image source={ICON_TIME} style={styles.cardHeaderIcon} />
            </View>

            <Text style={styles.patternSectionTitle}>Peak activity</Text>
            {patternAnalysis.temporalPatterns.slice(0, 3).map((pattern: any, i: number) => (
              <Text key={i} style={styles.patternText}>
                {pattern.period}: {pattern.frequency} reports
              </Text>
            ))}

            <Text style={styles.patternSectionTitle}>Common materials</Text>
            {patternAnalysis.materialTrends.slice(0, 5).map((material: any) => (
              <Text key={material.material} style={styles.patternText}>
                {material.material}: {material.frequency} reports
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI action plan</Text>
            {patternAnalysis.recommendations.map((rec: string, index: number) => (
              <Text key={index} style={styles.recommendationText}>
                • {rec}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent missions</Text>

            {reports.slice(0, 5).map((report) => (
              <View key={report.id} style={styles.reportItem}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportCategory}>
                    {report.category}
                  </Text>

                  <View
                    style={[
                      styles.severityDot,
                      report.severity === 'high' && styles.severityHigh,
                      report.severity === 'medium' && styles.severityMedium,
                      report.severity === 'low' && styles.severityLow,
                    ]}
                  />
                </View>

                <Text style={styles.reportDescription} numberOfLines={2}>
                  {report.description || 'No description for this mission.'}
                </Text>

                <View style={styles.reportMetaRow}>
                  <View style={styles.reportLocationRow}>
                    <Image source={ICON_LOCATION} style={styles.locationIconSmall} />
                    <Text style={styles.reportLocation}>
                      {getAreaName(report.location.lat, report.location.lng)}
                    </Text>
                  </View>
                  <Text style={styles.reportTime}>
                    {new Date(report.timestamp).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function getLevelInfo(missions: number) {
  const nextLevelXP = MISSIONS_PER_LEVEL;
  const level = missions === 0 ? 1 : Math.floor(missions / nextLevelXP) + 1;
  const currentXP = missions % nextLevelXP;
  const progress = (currentXP / nextLevelXP) * 100;

  return { level, currentXP, nextLevelXP, progress };
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.gradientStart,
    paddingTop: spacing(4),
    paddingHorizontal: spacing(3),
  },

  scroll: {
    marginTop: spacing(2),
  },
  scrollContent: {
    paddingBottom: spacing(6),
  },

  header: {
    alignItems: 'center',
    gap: spacing(0.5),
  },
  title: {
    fontFamily: 'CherryBomb-One',
    fontSize: 32,
    color: '#2A7390',
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  marginBottom: spacing(1),
  },
  metaText: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginTop: spacing(0.5),
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1),
    borderRadius: 999,
    ...shadows.sm,
  },
  refreshText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },

  loadingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing(6),
  },
  loadingText: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginTop: spacing(2),
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing(6),
  },
  emptyIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: spacing(2),
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    marginTop: spacing(1),
    color: colors.ink,
  },
  emptyBody: {
    ...textStyles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing(1),
    maxWidth: 260,
  },

  // HERO
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing(2),
    marginBottom: spacing(2),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C8ECF4',
    ...shadows.sm,
  },
  heroLeft: {
    flex: 1.5,
    marginRight: spacing(2),
  },
  heroRight: {
    flex: 1,
    alignItems: 'center',
  },
  heroBadge: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: '#1C2530',
    backgroundColor: '#E9F7FB',
    paddingHorizontal: spacing(1.2),
    paddingVertical: spacing(0.4),
    borderRadius: 999,
    marginBottom: spacing(1),
  },
  heroTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.ink,
  },
  heroSubtitle: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginTop: spacing(0.5),
  },
  xpBarBackground: {
    marginTop: spacing(1.5),
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  xpLabel: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing(0.6),
  },
  heroBot: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  heroChip: {
    marginTop: spacing(1),
    paddingHorizontal: spacing(1.4),
    paddingVertical: spacing(0.6),
    borderRadius: 999,
    backgroundColor: colors.homeMain,
  },
  heroChipText: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.ink,
    fontFamily: 'Poppins-SemiBold',
  },
  trendSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(1),
  },
  trendIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginRight: spacing(0.5),
  },
  heroTrendText: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.muted,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1),
    marginTop: spacing(1.5),
  },
  badgeChip: {
    paddingHorizontal: spacing(1.3),
    paddingVertical: spacing(0.5),
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  badgeChipUnlocked: {
    backgroundColor: '#FFE17A',
  },
  badgeChipText: {
    ...textStyles.bodySmall,
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'Poppins-SemiBold',
  },
  badgeChipTextUnlocked: {
    color: colors.ink,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
    gap: spacing(1.5),
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing(1.5),
    borderWidth: 1,
    borderColor: '#C8ECF4',
    ...shadows.sm,
  },
  statCardFull: {
    flexBasis: '100%',
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(0.5),
  },
  statIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginRight: spacing(0.8),
  },
  statLabel: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.muted,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.primaryDark,
    marginTop: spacing(0.5),
  },
  statHint: {
    ...textStyles.bodySmall,
    fontSize: 11,
    color: colors.muted,
    marginTop: spacing(0.5),
  },

  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(1),
  },
  trendCaption: {
    ...textStyles.bodySmall,
    fontSize: 11,
    color: colors.muted,
    marginLeft: spacing(1),
    flex: 1,
  },
  trendPill: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  trendGood: {
    backgroundColor: '#BBF7D0',
  },
  trendBad: {
    backgroundColor: '#FECACA',
  },
  trendText: {
    ...textStyles.bodySmall,
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing(2),
    marginBottom: spacing(2),
    borderWidth: 1,
    borderColor: '#C8ECF4',
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1),
  },
  cardHeaderIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.ink,
  },
  summaryText: {
    ...textStyles.bodySmall,
    color: colors.ink,
    marginTop: spacing(0.5),
  },

  hotspotItem: {
    backgroundColor: colors.card,
    padding: spacing(1.5),
    borderRadius: 18,
    marginTop: spacing(1),
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  hotspotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hotspotInfo: {
    flex: 1,
    marginRight: spacing(1),
  },
  hotspotName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  hotspotLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    marginRight: 4,
  },
  hotspotLocation: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.primaryDark,
  },
  hotspotChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(0.8),
    marginTop: spacing(0.8),
  },
  hotspotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(1.2),
    paddingVertical: spacing(0.4),
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
  },
  hotspotChipText: {
    ...textStyles.bodySmall,
    fontSize: 11,
    color: colors.ink,
  },
  materialIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    marginRight: 4,
  },
  hotspotFooterRow: {
    marginTop: spacing(1),
  },
  hotspotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(0.8),
  },
  timeIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    marginRight: 4,
  },
  hotspotTime: {
    ...textStyles.bodySmall,
    fontSize: 11,
    color: colors.muted,
  },
  hotspotActions: {
    flexDirection: 'row',
    gap: spacing(1),
  },
  mapButton: {
    flex: 1,
    backgroundColor: colors.leaderboard,
    paddingVertical: spacing(1),
    borderRadius: 999,
    alignItems: 'center',
  },
  mapButtonText: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.ink,
    fontSize: 13,
  },
  directionsButton: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing(1),
    borderRadius: 999,
    alignItems: 'center',
  },
  directionsButtonText: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    fontSize: 13,
  },

  severityDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#022C22',
  },
  severityHigh: {
    backgroundColor: '#EF4444',
    borderColor: '#7F1D1D',
  },
  severityMedium: {
    backgroundColor: '#F97316',
    borderColor: '#7C2D12',
  },
  severityLow: {
    backgroundColor: '#22C55E',
    borderColor: '#14532D',
  },

  patternSectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    marginTop: spacing(1),
    marginBottom: 2,
    color: colors.ink,
  },
  patternText: {
    ...textStyles.bodySmall,
    marginTop: 2,
    color: colors.ink,
  },

  recommendationText: {
    ...textStyles.bodySmall,
    marginTop: spacing(0.5),
    color: colors.ink,
  },

  reportItem: {
    backgroundColor: colors.card,
    padding: spacing(1.5),
    borderRadius: 14,
    marginTop: spacing(1),
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCategory: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.ink,
  },
  reportDescription: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginTop: 4,
  },
  reportMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(0.8),
  },
  reportLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconSmall: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    marginRight: 4,
  },
  reportLocation: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.primaryDark,
  },
  reportTime: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.muted,
  },
});
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import {
  colors,
  spacing,
  shadows,
  textStyles,
  radius,
  buttonVariants,
} from '@/theme';
import { pointsActions } from '@/services/points';
import { geminiAI, AIAnalysis, CleanupSuggestion } from '@/services/geminiAI';
import { CleanTownModal } from '@/components/CleanTownModal';

const ICON_AI_BOT = require('../../assets/Ai-bot.png');
const HERO_MISSION = require('../../assets/Cleaning-hero-flying-t-mission.png');
const ICON_SUCCESS = require('../../assets/cleantown-confetti-celebration.png');
const ICON_VOLUME = require('../../assets/box.png');
const ICON_PRIORITY = require('../../assets/clock_orange.png');
const ICON_IMPACT = require('../../assets/Recycle.png');
const ICON_HAZARD = require('../../assets/hazard.png');
const ICON_DUMP = require('../../assets/trash_bag.png');
const ICON_CAMERA = require('../../assets/camera.png');
const ICON_GALLERY = require('../../assets/photo.png');
const ICON_MIC = require('../../assets/mic.png');
const ICON_LOCATION = require('../../assets/location.png');
const ICON_ANALYTICS = require('../../assets/analytics-icon.png');
const ICON_COMPLETE = require('../../assets/tick.png');
const ICON_CAUTION = require('../../assets/caution.png');
const ICON_REPORT = require('../../assets/report-icon.png');

const BADGE_BEGINNER = require('../../assets/Beginner-badge.png');
const BADGE_BRONZE = require('../../assets/Bronze-badge.png');
const BADGE_SILVER = require('../../assets/Silver-badge.png');
const BADGE_GOLD = require('../../assets/Gold-badge.png');
const BADGE_DIAMOND = require('../../assets/Diamond.png');
const GOLD_BADGE_THRESHOLD = 2500;
const DIAMOND_BADGE_THRESHOLD = 5000;

const REPORT_BADGE_CONFIG = [
  { asset: BADGE_BEGINNER, label: 'Beginner', threshold: 0 },
  { asset: BADGE_BRONZE, label: 'Bronze', threshold: 500 },
  { asset: BADGE_SILVER, label: 'Silver', threshold: 1000 },
  { asset: BADGE_GOLD, label: 'Gold', threshold: GOLD_BADGE_THRESHOLD },
  { asset: BADGE_DIAMOND, label: 'Diamond', threshold: DIAMOND_BADGE_THRESHOLD },
];

function CTCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function ReportModal() {
  const [image, setImage] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [cleanupPlan, setCleanupPlan] = useState<CleanupSuggestion | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastMissionPoints, setLastMissionPoints] = useState(0);

  const [userTotalPoints, setUserTotalPoints] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [, , locationPerm] = await Promise.all([
          ImagePicker.requestMediaLibraryPermissionsAsync(),
          ImagePicker.requestCameraPermissionsAsync(),
          Location.requestForegroundPermissionsAsync(),
        ]);

        if (locationPerm.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (e) {
        console.error('Permissions/location error:', e);
      }
    })();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data();
        const total =
          (data?.totalPoints as number | undefined) ??
          (data?.points as number | undefined) ??
          0;
        setUserTotalPoints(total);
      },
      (error) => {
        console.error('Failed to subscribe to user points:', error);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    let points = 100;
    if (image) points += 50;
    if (audioUri) points += 25;
    setPointsEarned(points);
  }, [image, audioUri]);

  useEffect(() => {
    if (image && !autoAnalyzed && !aiAnalyzing && geminiAI.isAIAvailable()) {
      const timer = setTimeout(() => {
        autoAnalyzeWithAI();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [image, autoAnalyzed]);

  const autoAnalyzeWithAI = async () => {
    if (aiAnalyzing || autoAnalyzed) return;
    
    setAiAnalyzing(true);
    try {
      const analysis = await geminiAI.analyzeReport(
        image || undefined,
        'Analyze this image for illegal dumping'
      );
      setAiAnalysis(analysis);
      setAutoAnalyzed(true);

      if (analysis.severity !== 'low') {
        const plan = await geminiAI.generateCleanupPlan(analysis);
        setCleanupPlan(plan);
      }

      setShowAIModal(true);
    } catch (error) {
      console.error('Auto-analysis error:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!image) {
      Alert.alert(
        'Oops!',
        'Add a photo first so CleanTown AI can analyze it.',
      );
      return;
    }

    if (!geminiAI.isAIAvailable()) {
      Alert.alert(
        'AI Assistant',
        'Gemini AI is taking a quick break. You can still submit your mission.',
        [{ text: 'OK', style: 'default' }],
      );
      return;
    }

    setAiAnalyzing(true);
    try {
      const analysis = await geminiAI.analyzeReport(image || undefined, "Analyze this image for illegal dumping");
      setAiAnalysis(analysis);
      setAutoAnalyzed(true);

      if (analysis.severity !== 'low') {
        const plan = await geminiAI.generateCleanupPlan(analysis);
        setCleanupPlan(plan);
      }

      setShowAIModal(true);
    } catch (error) {
      console.error('AI analysis error:', error);
      Alert.alert(
        'AI Analysis',
        'AI is struggling with this one. You can still submit manually.',
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.length) {
        setImage(res.assets[0].uri);
        setAutoAnalyzed(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Oops!', 'Failed to pick image. Try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets?.length) {
        setImage(res.assets[0].uri);
        setAutoAnalyzed(false);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Oops!', 'Camera not working. Try gallery instead.');
    }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          'Turn on mic access to add a quick voice note.',
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await rec.startAsync();
      setRecording(rec);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Oops!', 'Failed to start recording. Try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri || null);
      setRecording(null);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Oops!', 'Failed to stop recording. Try again.');
    }
  };

  const submitReport = async () => {
    if (!coords) {
      Alert.alert(
        'Location needed',
        'CleanTown needs your location to place the mission on the map.',
      );
      return;
    }

    if (!image) {
      Alert.alert(
        'Photo needed',
        'Please take a photo of the dumping first.',
      );
      return;
    }

    try {
      setSubmitting(true);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert(
          'Sign in',
          'Log in to earn points and track your missions.',
        );
        return;
      }

      const category = aiAnalysis?.category === 'hazardous' ? 'hazard' : 'dumping';

      const reportData = {
        uid,
        userId: uid,
        note: aiAnalysis?.description || "AI-analyzed dumping report",
        location: {
          lat: coords.lat,
          lng: coords.lng,
        },
        category,
        status: 'open',
        type: 'dumping',
        description: aiAnalysis?.description || "AI-analyzed dumping report",
        hasPhoto: !!image,
        hasAudio: !!audioUri,
        createdAt: serverTimestamp(),
        confirmations: {
          stillThere: 0,
          notThere: 0,
          lastConfirmedAt: null,
        },
        aiAnalysis: aiAnalysis
          ? {
              category: aiAnalysis.category,
              severity: aiAnalysis.severity,
              suggestedActions: aiAnalysis.suggestedActions,
              materials: aiAnalysis.materials,
              estimatedVolume: aiAnalysis.estimatedVolume,
              cleanupPriority: aiAnalysis.cleanupPriority,
              environmentalImpact: aiAnalysis.environmentalImpact,
            }
          : null,
      };

      await addDoc(collection(db, 'reports'), reportData);

      const pointsSuccess = await pointsActions.reportLitter(uid, !!image);

      setLastMissionPoints(pointsEarned);
      setShowSuccessModal(true);

      if (!pointsSuccess) {
        Alert.alert(
          'Report logged',
          'Your mission is in the system. Points will sync shortly.',
        );
      }

      setImage(null);
      setAudioUri(null);
      setRecording(null);
      setAiAnalysis(null);
      setCleanupPlan(null);
      setAutoAnalyzed(false);
      setPointsEarned(100);
    } catch (e: any) {
      console.error('Submission error:', e);
      Alert.alert(
        'Submission failed',
        'Something glitched. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setAutoAnalyzed(false);
  };

  const clearAudio = () => {
    setAudioUri(null);
    setRecording(null);
  };

  const getMaterialEmoji = (material: string): string => {
    const emojiMap: { [key: string]: string } = {
      'plastic': '🥤',
      'glass': '🍶',
      'paper': '📄',
      'metal': '🥫',
      'organic': '🍎',
      'hazardous': '⚠️',
      'construction': '🏗️',
      'electronic': '💻',
      'textile': '👕',
      'rubber': '🛞',
      'medical': '🏥',
      'mixed waste': '🗑️'
    };
    return emojiMap[material] || '📦';
  };

  const getShieldIcon = () => {
    return (
      [...REPORT_BADGE_CONFIG]
        .filter((badge) => pointsEarned >= badge.threshold)
        .sort((a, b) => b.threshold - a.threshold)[0]?.asset || BADGE_BEGINNER
    );
  };


  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
       <View style={styles.headerRow}>
          <Image
            source={HERO_MISSION}
            style={styles.heroImage}
            resizeMode="contain"
          />

       <View style={styles.pointsShield}>
        <Image source={getShieldIcon()} style={styles.shieldIcon} />
        <Text style={styles.pointsValue}>
          {userTotalPoints.toLocaleString()}
        </Text>
      </View>
        </View>

        <Text style={styles.title}>Report Illegal Dumping</Text>
        <Text style={styles.subtitle}>
    Earn points. Keep your streak alive.
</Text>

        {aiAnalyzing && (
          <View style={styles.autoAnalysisBanner}>
            <Image source={ICON_ANALYTICS} style={styles.bannerIcon} />
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.autoAnalysisText}>
              AI is analyzing your photo...
            </Text>
          </View>
        )}

        {autoAnalyzed && aiAnalysis && !aiAnalyzing && (
          <View style={styles.autoAnalysisCompleteBanner}>
            <View style={styles.autoAnalysisCompleteRow}>
              <Image source={ICON_COMPLETE} style={styles.bannerIcon} />
              <Text style={styles.autoAnalysisCompleteText}>
                AI identified: {aiAnalysis.category.replace('_', ' ')} dumping
              </Text>
            </View>
            <Pressable onPress={() => setShowAIModal(true)}>
              <Text style={styles.viewDetailsText}>View details</Text>
            </Pressable>
          </View>
        )}

        <CTCard style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Report Trash </Text>
            </View>
            <Text style={styles.sectionHint}>Capture: AI will do the rest.</Text>
          </View>

         <View style={styles.mediaButtonsRow}>
  <Pressable
    onPress={pickImage}
    style={[styles.photoButton, styles.photoButtonGallery]}
  >
    <Image source={ICON_GALLERY} style={{ width: 26, height: 26 }} />
    <Text style={styles.photoButtonLabel}>Gallery</Text>
    <Text style={styles.photoButtonPoints}>+50 pts</Text>
  </Pressable>

  <Pressable
    onPress={takePhoto}
    style={[styles.photoButton, styles.photoButtonCamera]}
  >
    <Image source={ICON_CAMERA} style={{ width: 26, height: 26 }} />
    <Text style={styles.photoButtonLabel}>Camera</Text>
    <Text style={styles.photoButtonPoints}>+50 pts</Text>
  </Pressable>

  <Pressable
    onPress={recording ? stopRecording : startRecording}
    style={[
      styles.photoButton,
      styles.photoButtonRecord,
      recording && styles.photoButtonRecording,
    ]}
  >
    <Image source={ICON_MIC} style={{ width: 26, height: 26 }} />
    <Text style={styles.photoButtonLabel}>
      {recording ? 'Stop' : audioUri ? 'Re-record' : 'Recording'}
    </Text>
    <Text style={styles.photoButtonPoints}>+25 pts</Text>
  </Pressable>
</View>


          {audioUri && (
            <View style={styles.audioMetaRow}>
              <Text style={styles.audioMetaText}>Voice note ready</Text>
              <Pressable onPress={clearAudio}>
                <Text style={styles.audioRemoveText}>Remove</Text>
              </Pressable>
            </View>
          )}

          {image && (
            <View style={styles.photoPreviewWrapper}>
              <Image
                source={{ uri: image }}
                style={styles.photoPreview}
              />
              <View style={styles.photoMetaRow}>
                <Text style={styles.photoMetaText}>
                  Photo ready for AI analysis
                </Text>
                <Pressable onPress={clearImage} style={styles.removePill}>
                  <Text style={styles.removePillText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )}
        </CTCard>

        {coords && (
          <CTCard style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Image source={ICON_LOCATION} style={styles.sectionTitleIcon} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
            </View>
            <Text style={styles.coordsText}>
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </Text>
          </CTCard>
        )}

        <Pressable
          disabled={submitting || !image}
          onPress={submitReport}
          style={[
            buttonVariants.primary.container,
            styles.submitButton,
            (!image || submitting) && styles.submitButtonDisabled,
          ]}
      >
          <View style={styles.submitRow}>
            <Image source={ICON_REPORT} style={styles.submitIcon} />
            <Text style={[buttonVariants.primary.text, styles.submitButtonText]}>
              {submitting ? 'Sending mission…' : `Submit Report  +${pointsEarned} pts`}
            </Text>
          </View>
          <Text style={styles.submitSubText}>
            {image
              ? autoAnalyzed 
                ? 'AI has analyzed your photo.'
                : 'Ready to submit! AI will analyze automatically.'
              : 'Take a photo to continue.'}
          </Text>
        </Pressable>
      </ScrollView>

      <Pressable
        onPress={analyzeWithAI}
        disabled={aiAnalyzing || !image}
        style={[
          styles.aiFab,
          (aiAnalyzing || !image) && styles.aiFabDisabled,
          autoAnalyzed && styles.aiFabAnalyzed,
        ]}
      >
        {aiAnalyzing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <View style={styles.aiIconBubble}>
              <Image source={ICON_AI_BOT} style={styles.aiIcon} />
              {autoAnalyzed && <View style={styles.aiSuccessBadge} />}
            </View>
            <Text style={styles.aiLabel}>
              {autoAnalyzed ? 'AI Ready' : 'Analyze Photo'}
            </Text>
          </>
        )}
      </Pressable>

           <Modal
        visible={showAIModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAIModal(false)}
      >
        {aiAnalysis && (
          <CleanTownModal
            icon={ICON_AI_BOT}
            title="AI Analysis Complete"
            subtitle={`We’ve flagged this as ${aiAnalysis.category.replace('_', ' ')} dumping.`}
            onClose={() => setShowAIModal(false)}
            showCloseTextButton
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: spacing(38), marginTop: spacing(1) }}
              contentContainerStyle={{ paddingBottom: spacing(1.5) }}
            >
              {/* TOP CHIPS ROW */}
              <View style={styles.aiBadgesRow}>
                <View style={styles.aiBadge}>
                  <View style={styles.aiBadgeContent}>
                    <Image
                      source={
                        aiAnalysis.category === 'hazardous'
                          ? ICON_HAZARD
                          : ICON_DUMP
                      }
                      style={styles.aiBadgeIcon}
                    />
                    <Text style={styles.aiBadgeLabel}>
                      {aiAnalysis.category.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.aiSeverityBadge,
                    aiAnalysis.severity === 'high' && styles.aiSeverityHigh,
                    aiAnalysis.severity === 'medium' && styles.aiSeverityMedium,
                    aiAnalysis.severity === 'low' && styles.aiSeverityLow,
                  ]}
                >
                  <View style={styles.aiBadgeContent}>
                    <Image
                      source={
                        aiAnalysis.severity === 'high'
                          ? ICON_HAZARD
                          : aiAnalysis.severity === 'medium'
                          ? ICON_PRIORITY
                          : ICON_IMPACT
                      }
                      style={styles.aiBadgeIcon}
                    />
                    <Text style={styles.aiSeverityText}>
                      {aiAnalysis.severity === 'high'
                        ? 'Urgent'
                        : aiAnalysis.severity === 'medium'
                        ? 'Medium'
                        : 'Low'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* GRID SUMMARY */}
              <View style={styles.aiDetailsGrid}>
                <View style={styles.aiDetailItem}>
                  <Image source={ICON_VOLUME} style={{ width: 20, height: 20 }} />
                  <Text style={styles.aiDetailValue}>
                    {aiAnalysis.estimatedVolume || 'medium'}
                  </Text>
                </View>
                <View style={styles.aiDetailItem}>
                  <Image source={ICON_PRIORITY} style={{ width: 20, height: 20 }} />
                  <Text style={styles.aiDetailValue}>
                    {aiAnalysis.cleanupPriority || 'scheduled'}
                  </Text>
                </View>
                <View style={styles.aiDetailItem}>
                  <Image source={ICON_IMPACT} style={{ width: 20, height: 20 }} />
                  <Text style={styles.aiDetailValue}>
                    {aiAnalysis.environmentalImpact || 'medium'}
                  </Text>
                </View>
              </View>

              {/* DIVIDER */}
              <View style={styles.aiDivider} />

              {/* AI ANALYSIS TEXT */}
              <Text style={styles.aiSectionTitle}>AI Analysis</Text>
              <Text style={styles.aiBodyText}>
                {aiAnalysis.description}
              </Text>

              {/* MATERIALS */}
              {aiAnalysis.materials?.length ? (
                <>
                  <Text style={styles.aiSectionTitle}>Materials Detected</Text>
                  <View style={styles.materialsChips}>
                    {aiAnalysis.materials.map((material, index) => (
                      <View key={index} style={styles.materialChip}>
                        <Text style={styles.materialChipText}>
                          {getMaterialEmoji(material)} {material}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {/* RECOMMENDED ACTIONS */}
              {aiAnalysis.suggestedActions?.length ? (
                <>
                  <Text style={styles.aiSectionTitle}>Recommended Actions</Text>
                  {aiAnalysis.suggestedActions.map((action, index) => (
                    <Text key={index} style={styles.aiListItem}>
                      • {action}
                    </Text>
                  ))}
                </>
              ) : null}

              {/* CLEANUP PLAN (OPTIONAL) */}
              {cleanupPlan && (
                <>
                  <Text style={styles.aiSectionTitle}>Cleanup Mission Plan</Text>
                  {/* you can flesh this out later with more plan details */}
                </>
              )}
            </ScrollView>
          </CleanTownModal>
        )}
      </Modal>


       <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={{ flex: 1 }}>
          {showSuccessModal && (
            <View style={styles.confettiOverlay} pointerEvents="none">
              <ConfettiCannon
                count={120}
                origin={{ x: 0, y: 0 }}
                fadeOut
                explosionSpeed={350}
                fallSpeed={3000}
              />
            </View>
          )}

          <CleanTownModal
            icon={ICON_SUCCESS}
            title="Mission complete!"
            subtitle={
              autoAnalyzed
                ? 'AI analyzed and submitted your report!'
                : 'Your report has been submitted!'
            }
          >
            <View style={styles.successStatsRow}>
              <View style={styles.successStatPill}>
                <Text style={styles.successStatLabel}>Total pts</Text>
                <Text style={styles.successStatValue}>
                  +{lastMissionPoints}
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                buttonVariants.outline.container,
                styles.successButton,
              ]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text
                style={[
                  buttonVariants.outline.text,
                  styles.successButtonText,
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </CleanTownModal>
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
    paddingTop: spacing(3),
    paddingBottom: spacing(10),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(1.5),
  },
  heroImage: {
    width: 140,
    height: 120,
  },
  title: {
    fontFamily: 'CherryBomb-One',
    fontSize: 32,
    color: '#2A7390',
    textAlign: 'center',
    marginBottom: spacing(0.5),
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing(2),
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.pointsBackground,
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    marginTop: spacing(1.5),
  },
  pointsLabel: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginRight: spacing(1),
  },
  pointsValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.ink,
  },

confettiContainer: {
  ...StyleSheet.absoluteFillObject,
  zIndex: 5,
},

  autoAnalysisBanner: {
    backgroundColor: '#106593',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(2),
    borderRadius: radius.md,
    marginBottom: spacing(2),
    ...shadows.sm,
  },
  bannerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: spacing(1),
  },
  autoAnalysisText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: spacing(1),
  },
  autoAnalysisCompleteBanner: {
    backgroundColor: '#41AB30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(2),
    borderRadius: radius.md,
    marginBottom: spacing(2),
    ...shadows.sm,
  },
  autoAnalysisCompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing(2),
  },
  autoAnalysisCompleteText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  viewDetailsText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    textDecorationLine: 'underline',
  },
photoButtonPoints: {
  ...textStyles.bodyTiny,
  fontFamily: 'Poppins-SemiBold',
  marginTop: 2,
  color: '#ffffff',
},

  pointsShield: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pointsBackground,
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    gap: spacing(1),
  },
  shieldIcon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },

  card: {
    backgroundColor: '#f2f2fdff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#C8ECF4',
    paddingVertical: spacing(2.2),
    paddingHorizontal: spacing(2.5),
    marginBottom: spacing(1.5),
    ...shadows.sm,
  },
  sectionCard: {},

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing(0.5),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.6),
    flexShrink: 1,
  },
  sectionTitleIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 16,
  },
  sectionHint: {
    ...textStyles.bodySmall,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: spacing(1),
  },

  mediaButtonsRow: {
    flexDirection: 'row',
    gap: spacing(1.5),
    marginTop: spacing(1.5),
    marginBottom: spacing(1),
  },
  mediaIcon: {
  width: 26,
  height: 26,
  resizeMode: 'contain',
},

mediaIconMic: {
  width: 32, 
  height: 32,
  resizeMode: 'contain',
},

  photoButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing(1.8),
    alignItems: 'center',
    ...shadows.sm,
  },
  photoButtonGallery: {
    backgroundColor: colors.idTrash,
  },
  photoButtonCamera: {
    backgroundColor: colors.hotspots,
  },
  photoButtonRecord: {
    backgroundColor: colors.leaderboard,
  },
  photoButtonRecording: {
    backgroundColor: colors.danger,
  },
  photoButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  photoButtonLabel: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.ink,
  },
  photoPreviewWrapper: {
    marginTop: spacing(1),
  },
  photoPreview: {
    width: '100%',
    height: 170,
    borderRadius: radius.md,
    marginBottom: spacing(0.8),
  },
  photoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoMetaText: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.primaryDark,
  },
  removePill: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.4),
    borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  removePillText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: colors.danger,
  },


  audioMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing(1),
  },
  audioMetaText: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.primaryDark,
  },
  audioRemoveText: {
    ...textStyles.bodySmall,
    color: colors.danger,
    fontSize: 12,
  },

  coordsText: {
    ...textStyles.bodySmall,
    marginTop: spacing(1),
    fontSize: 13,
    color: colors.ink,
  },

  submitButton: {
    marginTop: spacing(1),
    marginBottom: spacing(4),
    borderRadius: radius.xl,
    paddingVertical: spacing(2.2),
    ...shadows.lg,
  },
  submitButtonDisabled: {
    backgroundColor: colors.muted,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
  },
  submitIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 18,
    textTransform: 'none',
  },
  submitSubText: {
    ...textStyles.bodySmall,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
  },

  aiFab: {
    position: 'absolute',
    right: spacing(3),
    bottom: spacing(8),
    backgroundColor: colors.primaryDark,
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    ...shadows.lg,
  },
  aiFabDisabled: {
    backgroundColor: colors.muted,
  },
  aiFabAnalyzed: {
    backgroundColor: '#41AB30',
  },
  aiIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  aiIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  aiSuccessBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#41AB30',
    borderWidth: 2,
    borderColor: '#fff',
  },
  aiLabel: {
    ...textStyles.bodySmall,
    color: '#ffffff',
    fontFamily: 'Poppins-SemiBold',
  },

  aiModalScreen: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(3),
    paddingTop: spacing(4),
    paddingBottom: spacing(2),
  },
  aiModalTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 24,
    color: '#2A7390',
    textAlign: 'center',
    flex: 1,
    marginBottom: spacing(0.5),
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FC7A12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  aiBadgeContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing(0.5),
},


  aiBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: spacing(1.5),
    gap: spacing(1),
  },
  aiBadge: {
    flex: 1,
    backgroundColor: colors.primary + '1A',
    paddingVertical: spacing(0.8),
    borderRadius: radius.md,
    paddingHorizontal: spacing(1),
  },
  aiSeverityBadge: {
    flex: 1,
    paddingVertical: spacing(0.8),
    borderRadius: radius.md,
    paddingHorizontal: spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(0.5),
  },
  aiBadgeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  aiDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(1.5),
    marginTop: spacing(0.5),
  },
  aiDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  aiDetailValue: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.ink,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  aiSectionTitle: {
    ...textStyles.h3,
    fontSize: 14,
    marginBottom: spacing(0.5),
    marginTop: spacing(1),
  },
  aiBodyText: {
    ...textStyles.bodySmall,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing(1),
  },
  aiDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: spacing(1.5),
  },
  
  aiBadgeLabel: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.primaryDark,
  },
  aiSeverityMedium: {
    backgroundColor: colors.accent + '40',
  },
  aiSeverityLow: {
    backgroundColor: colors.primary + '26',
  },
  aiSeverityText: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: colors.ink,
  },

  aiDetailLabel: {
    ...textStyles.bodyTiny,
    color: colors.muted,
    marginBottom: 2,
  },
  
  materialsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1),
    marginBottom: spacing(1.5),
  },
  materialChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: 12,
  },
  materialChipText: {
    ...textStyles.bodyTiny,
    color: colors.primaryDark,
    fontFamily: 'Poppins-Medium',
  },
  aiListItem: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginBottom: 6,
    lineHeight: 20,
  },
  aiPlanRow: {
    flexDirection: 'row',
    marginBottom: spacing(2),
    gap: spacing(2),
  },
  aiPlanCol: {
    flex: 1,
  },
  aiPlanLabel: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginBottom: 4,
  },
  aiPlanValue: {
    ...textStyles.bodySmall,
    color: colors.ink,
  },
  aiPlanValueInline: {
    ...textStyles.bodySmall,
    color: colors.ink,
  },
  aiModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing(3),
    marginBottom: spacing(4),
    marginTop: spacing(1),
  },
  aiModalCloseButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#72C55D',
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingVertical: spacing(1.2),
    paddingHorizontal: spacing(4),
    alignItems: 'center',
  },
  aiModalCloseText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1C2530',
    textAlign: 'center',
  },

  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(3),
  },
  successCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 24,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    alignItems: 'center',
  },
  successImage: {
    width: 140,
    height: 120,
    resizeMode: 'contain',
    marginBottom: spacing(2),
  },
  successTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 24,
    color: '#2A7390',
    marginBottom: spacing(0.5),
    textAlign: 'center',
  },
  successSubtitle: {
    ...textStyles.bodySmall,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: spacing(2),
  },
  successStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing(2),
  },
  successStatPill: {
    backgroundColor: '#f9ce59ff',
    borderRadius: 999,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.2),
  },
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  successStatLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  successStatValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  successButton: {
    width: '100%',
    marginTop: spacing(0.5),
    borderRadius: 999,
  },
  successButtonText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

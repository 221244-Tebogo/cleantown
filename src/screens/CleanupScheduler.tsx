import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { colors, spacing, shadows, textStyles, radius } from '@/theme';
import { pointsActions } from '@/services/points';
import { CleanTownModal } from '@/components/CleanTownModal';
import Constants from 'expo-constants';
import { playSound, BUTTON_PRESS_SOUND, AI_DING_SOUND } from '@/services/sound';

interface CleanupEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  createdBy: string;
  createdAt: any;
  participants: string[];
  declined: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
  aiOptimized?: boolean;
  coordinates?: { lat: number; lng: number };
}

const MASCOT_IMAGE = require('../../assets/cleaning-hero.png');
const BROOM_ICON = require('../../assets/Broom.png');
const ICON_LOCATION = require('../../assets/location.png');
const ICON_CLOCK = require('../../assets/clock_orange.png');
const ICON_PROFILE = require('../../assets/profile-icon.png');
const ICON_CALENDAR = require('../../assets/calendar.png');
const ICON_MAP = require('../../assets/maps-icon.png');
const ICON_LAUNCH = require('../../assets/Broom.png');
const ICON_UPCOMING = require('../../assets/maps-icon.png');
const ICON_SUCCESS = require('../../assets/mascot_celebrate.png');
const BADGE_BEGINNER = require('../../assets/Beginner-badge.png');
const BADGE_BRONZE = require('../../assets/Bronze-badge.png');
const BADGE_SILVER = require('../../assets/Silver-badge.png');
const BADGE_GOLD = require('../../assets/Gold-badge.png');
const BADGE_DIAMOND = require('../../assets/Diamond.png');

const GOLD_BADGE_THRESHOLD = 2500;
const DIAMOND_BADGE_THRESHOLD = 5000;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
  (Constants.expoConfig?.extra as any)?.googlePlacesApiKey ??
  undefined;

console.log(
  '[Places] Key loaded?',
  !!PLACES_API_KEY,
  typeof PLACES_API_KEY === 'string' ? PLACES_API_KEY.slice(0, 6) : PLACES_API_KEY
);

export default function CleanupScheduler() {
  const [title, setTitle] = useState('Community Cleanup');
  const [description, setDescription] = useState(
    'Quick cleanup mission with your community.'
  );
  const [location, setLocation] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationCoords, setLocationCoords] = useState<
    { lat: number; lng: number } | null
  >(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<
    { place_id: string; description: string }[]
  >([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [date, setDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [events, setEvents] = useState<CleanupEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userTotalPoints, setUserTotalPoints] = useState(0);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    fetchEvents();
    fetchUserPoints();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsQuery = query(
        collection(db, 'cleanupEvents'),
        where('date', '>=', new Date())
      );

      const unsubscribe = onSnapshot(
        eventsQuery,
        (snapshot) => {
          const eventsData: CleanupEvent[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            eventsData.push({
              id: docSnap.id,
              ...data,
              date: data.date.toDate(),
              createdAt: data.createdAt.toDate(),
            } as CleanupEvent);
          });

          eventsData.sort((a, b) => a.date.getTime() - b.date.getTime());
          setEvents(eventsData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching events:', error);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const total =
          (data.totalPoints as number | undefined) ??
          (data.points as number | undefined) ??
          0;
        setUserTotalPoints(total);
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
    }
  };

  const onChangeDateTime = (_: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setShowDate(false);
      setShowTime(false);
      return;
    }
    setDate(selectedDate);
    setShowDate(false);
    setShowTime(false);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }) +
    ' • ' +
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const getRelativeTime = (d: Date) => {
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return 'Past mission';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays}d`;
    return `In ${diffDays}d`;
  };

  const getBadgeForPoints = (points = 0) => {
    if (points >= DIAMOND_BADGE_THRESHOLD) return BADGE_DIAMOND;
    if (points >= GOLD_BADGE_THRESHOLD) return BADGE_GOLD;
    if (points >= 1000) return BADGE_SILVER;
    if (points >= 500) return BADGE_BRONZE;
    return BADGE_BEGINNER;
  };

  const fetchPlaceSuggestions = useCallback(
  async (input: string) => {
    if (!PLACES_API_KEY) {
      console.log('Places API key not available, skipping autocomplete');
      setPlaceSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    if (input.trim().length < 3) {
      setPlaceSuggestions([]);
      setSearchingPlaces(false);
      return;
    }

    try {
      setSearchingPlaces(true);

      const url =
        'https://maps.googleapis.com/maps/api/place/autocomplete/json' +
        `?input=${encodeURIComponent(input.trim())}` +
        // removed: '&types=geocode'
        '&language=en' +
        '&components=country:za' +
        `&key=${PLACES_API_KEY}`;

      console.log('Fetching place suggestions:', url);
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log(
        'Places API response status:',
        json.status,
        json.error_message
      );

      if (json.status !== 'OK') {
        setPlaceSuggestions([]);
        return;
      }

      const items = (json.predictions || []).map((p: any) => ({
        place_id: p.place_id,
        description: p.description,
      }));

      setPlaceSuggestions(items);
    } catch (err) {
      console.error('Places autocomplete fetch failed:', err);
      setPlaceSuggestions([]);
    } finally {
      setSearchingPlaces(false);
    }
  },
  []
);


  const handleSelectPlace = async (placeId: string, description: string) => {
    setLocationQuery(description);
    setLocation(description);
    setPlaceSuggestions([]);

    if (!PLACES_API_KEY) {
      console.log('Places API key not available, skipping coordinate lookup');
      setLocationCoords(null);
      return;
    }

    try {
      setSearchingPlaces(true);

      const url =
        'https://maps.googleapis.com/maps/api/place/details/json' +
        `?place_id=${encodeURIComponent(placeId)}` +
        '&fields=geometry/location' +
        `&key=${PLACES_API_KEY}`;

      console.log('Fetching place details:', url);
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log('Place details response status:', json.status, json.error_message);

      if (json.status !== 'OK') {
        setLocationCoords(null);
        return;
      }

      const loc = json.result?.geometry?.location;
      if (loc?.lat != null && loc?.lng != null) {
        console.log('Got coordinates:', loc);
        setLocationCoords({ lat: loc.lat, lng: loc.lng });
      } else {
        console.log('No coordinates found in place details');
        setLocationCoords(null);
      }
    } catch (err) {
      console.error('Places details fetch failed:', err);
      setLocationCoords(null);
    } finally {
      setSearchingPlaces(false);
    }
  };

  const createEvent = async () => {
    if (!currentUserId) {
      Alert.alert('Sign in', 'Log in to create missions.');
      return;
    }

    if (!title.trim() || !description.trim() || !locationQuery.trim()) {
      Alert.alert('Missing info', 'Add a title, brief and location etc.');
      return;
    }

    if (!locationCoords && PLACES_API_KEY) {
      Alert.alert(
        'Pick from list',
        'Choose a location from the suggestions so your squad can find it on the map.'
      );
      return;
    }

    if (!PLACES_API_KEY) {
      console.log('Creating event without coordinates (Places API unavailable)');
    }

    setCreating(true);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        location: locationQuery.trim(),
        date,
        createdBy: currentUserId,
        createdAt: new Date(),
        participants: [currentUserId],
        declined: [],
        status: 'upcoming' as const,
        aiOptimized: false,
        coordinates: locationCoords || null,
      };

      await addDoc(collection(db, 'cleanupEvents'), eventData);

if (pointsActions.createEvent) {
  await pointsActions.createEvent(currentUserId);
}


      playSound(AI_DING_SOUND);

      setShowSuccessModal(true);
      setConfettiKey((k) => k + 1);
      setShowFormModal(false);

      setTitle('Community Cleanup');
      setDescription('Quick cleanup mission with the squad.');
      setLocation('');
      setLocationQuery('');
      setLocationCoords(null);
      setPlaceSuggestions([]);
      setDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Creation failed', `Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const rsvpToEvent = async (
    eventId: string,
    response: 'confirm' | 'decline'
  ) => {
    if (!currentUserId) {
      Alert.alert('Sign in', 'Log in to join missions.');
      return;
    }

    try {
      const eventRef = doc(db, 'cleanupEvents', eventId);

      if (response === 'confirm') {
        await updateDoc(eventRef, {
          participants: arrayUnion(currentUserId),
          declined: arrayRemove(currentUserId),
        });

if (pointsActions.joinEvent) {
  await pointsActions.joinEvent(currentUserId);
}


        Alert.alert('Joined', "You're on this mission.");
      } else {
        await updateDoc(eventRef, {
          declined: arrayUnion(currentUserId),
          participants: arrayRemove(currentUserId),
        });
        Alert.alert('Skipped', 'You skipped this one, better luck next time.');
      }
    } catch (error: any) {
      console.error('Error updating RSVP:', error);
      Alert.alert('RSVP failed', `Error: ${error.message}`);
    }
  };

  const getUserRSVPStatus = (event: CleanupEvent) => {
    if (!currentUserId) return 'none';
    if (event.participants.includes(currentUserId)) return 'confirmed';
    if (event.declined.includes(currentUserId)) return 'declined';
    return 'none';
  };

  const canUserRSVP = (event: CleanupEvent) => {
    if (!currentUserId) return false;
    if (event.createdBy === currentUserId) return false;
    if (getUserRSVPStatus(event) !== 'none') return false;
    return true;
  };

  const eventsCreatedByUser = currentUserId
    ? events.filter((e) => e.createdBy === currentUserId).length
    : 0;
  const eventsJoinedByUser = currentUserId
    ? events.filter((e) => e.participants.includes(currentUserId)).length
    : 0;
  const joinedButNotCreated = Math.max(
    0,
    eventsJoinedByUser - eventsCreatedByUser
  );
const estimatedXP = eventsCreatedByUser * 80 + joinedButNotCreated * 40;

  return (
    <View style={styles.screen}>
      <Modal
        visible={showFormModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormModal(false)}
      >
        <CleanTownModal
          title="Host a cleanup"
          subtitle="Pick a spot, date & time – we'll rally the squad."
          icon={ICON_LAUNCH}
          onClose={() => setShowFormModal(false)}
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Host a quick mission</Text>

            <View style={styles.fieldRow}>
              <Image source={ICON_CALENDAR} style={styles.fieldIcon} />
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={styles.fieldInput}
                placeholder="Community Mission title"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={[styles.fieldRow, styles.fieldRowMultiline]}>
              <Image source={BROOM_ICON} style={styles.fieldIcon} />
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                style={[styles.fieldInput, styles.fieldInputMultiline]}
                placeholder="What are you cleaning?"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={{ marginBottom: spacing(1.5) }}>
              <View style={styles.fieldRow}>
                <Image source={ICON_LOCATION} style={styles.fieldIcon} />
                <TextInput
                  value={locationQuery}
                  onChangeText={(text) => {
                    setLocationQuery(text);
                    setLocationCoords(null);
                    setLocation(text);
                    if (PLACES_API_KEY) {
                      fetchPlaceSuggestions(text);
                    }
                  }}
                  style={styles.fieldInput}
                  placeholder={
                    PLACES_API_KEY ? 'Search location…' : 'Enter location'
                  }
                  placeholderTextColor={colors.muted}
                  autoCorrect={false}
                />
              </View>

              {!PLACES_API_KEY && (
                <Text style={styles.placesHint}>
                  🔧 Location search disabled - enter address manually
                </Text>
              )}

              {PLACES_API_KEY && searchingPlaces && (
                <Text style={styles.placesHint}>Searching places…</Text>
              )}

              {PLACES_API_KEY && placeSuggestions.length > 0 && (
                <View style={styles.placesDropdown}>
                  {placeSuggestions.map((p) => (
                    <Pressable
                      key={p.place_id}
                      onPress={() =>
                        handleSelectPlace(p.place_id, p.description)
                      }
                      style={styles.placesItem}
                    >
                      <Text style={styles.placesItemText} numberOfLines={1}>
                        {p.description}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.dateTimeInlineRow}>
              <View style={styles.dateTimeLabelCol}>
                <View style={styles.datePillLabelRow}>
                  <Image source={ICON_CLOCK} style={styles.datePillIcon} />
                  <Text style={styles.datePillLabel}>Date & time</Text>
                </View>
                <Text style={styles.selectedDateText}>{formatDate(date)}</Text>
              </View>

              <View style={styles.dateTimeIconRow}>
                <Pressable
                  onPress={() => setShowDate(true)}
                  style={styles.dateIconButton}
                >
                  <Image source={ICON_CALENDAR} style={styles.dateTimeIcon} />
                </Pressable>
                <Pressable
                  onPress={() => setShowTime(true)}
                  style={styles.dateIconButton}
                >
                  <Image source={ICON_CLOCK} style={styles.dateTimeIcon} />
                </Pressable>
              </View>
            </View>

            {(showDate || showTime) && (
              <DateTimePicker
                value={date}
                mode={showDate ? 'date' : 'time'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => {
                  setShowDate(false);
                  setShowTime(false);
                  onChangeDateTime(e, d || date);
                }}
              />
            )}

            <Pressable
              onPress={() => {
                playSound(BUTTON_PRESS_SOUND);
                createEvent();
              }}
              style={styles.launchButton}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.launchContent}>
                  <View style={styles.launchIconWrapper}>
                    <Image source={BROOM_ICON} style={styles.launchIcon} />
                  </View>
                  <Text style={styles.launchText}>Launch mission</Text>
                </View>
              )}
            </Pressable>
          </View>
        </CleanTownModal>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={MASCOT_IMAGE}
              style={styles.headerMascot}
              resizeMode="contain"
            />
            <View style={styles.pointsPill}>
              <Image
                source={getBadgeForPoints(userTotalPoints)}
                style={styles.pointsPillIcon}
              />
              <Text style={styles.pointsPillText}>
                {userTotalPoints.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>Cleanup missions</Text>
          <Text style={styles.headerSubtitle}>Tap. Squad up. Clean.</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hosted</Text>
            <Text style={styles.statValue}>{eventsCreatedByUser}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Joined</Text>
            <Text style={styles.statValue}>{eventsJoinedByUser}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>XP est.</Text>
            <Text style={styles.statValue}>{estimatedXP}</Text>
          </View>
        </View>

        <View style={styles.tileRow}>
          <Pressable
            style={styles.tile}
            onPress={() => {
              playSound(BUTTON_PRESS_SOUND);
              setShowFormModal(true);
            }}
          >
            <Image source={ICON_LAUNCH} style={styles.tileIcon} />
            <View>
              <Text style={styles.sectionHeading}>New cleanup</Text>
              <Text style={styles.tileSubtext}>Host a mission</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.containerBox}>
          <View style={styles.listHeaderRow}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing(1),
              }}
            >
              <Image
                source={ICON_MAP}
                style={{ width: 20, height: 20, resizeMode: 'contain' }}
              />
              <Text style={styles.upcomingTitle}>Upcoming</Text>
            </View>
            <View style={styles.listCountPill}>
              <Text style={styles.listCountText}>{events.length}</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: spacing(3) }}
            />
          ) : events.length === 0 ? (
            <View style={styles.emptyState}>
              <Image
                source={ICON_SUCCESS}
                style={{
                  width: 120,
                  height: 120,
                  marginBottom: spacing(2),
                  resizeMode: 'contain',
                }}
              />
              <Text
                style={[
                  textStyles.h3,
                  { marginBottom: spacing(1), textAlign: 'center' },
                ]}
              >
                No missions yet
              </Text>
              <Text
                style={[
                  textStyles.bodySmall,
                  { color: colors.muted, textAlign: 'center' },
                ]}
              >
                Be the first to host a cleanup.
              </Text>
              <Pressable
                style={styles.successButton}
                onPress={() => {
                  playSound(BUTTON_PRESS_SOUND);
                  setShowFormModal(true);
                }}
              >
                <Text style={styles.successButtonText}>Start a mission</Text>
              </Pressable>
            </View>
          ) : (
            events.map((event) => {
              const userStatus = getUserRSVPStatus(event);
              const canRSVP = canUserRSVP(event);
              const isCreator = event.createdBy === currentUserId;

              return (
                <View
                  key={event.id}
                  style={[
                    styles.missionRow,
                    isCreator && styles.missionRowCreator,
                  ]}
                >
                  {isCreator && (
                    <View
                      style={[
                        styles.statusRibbon,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Image source={ICON_PROFILE} style={styles.statusIcon} />
                      <Text style={styles.statusRibbonText}>Leader</Text>
                    </View>
                  )}
                  {!isCreator && userStatus === 'confirmed' && (
                    <View
                      style={[
                        styles.statusRibbon,
                        { backgroundColor: '#106593' },
                      ]}
                    >
                      <Image source={ICON_PROFILE} style={styles.statusIcon} />
                      <Text style={styles.statusRibbonText}>Joined</Text>
                    </View>
                  )}

                  <View style={styles.missionTopRow}>
                    <View style={styles.missionTagRow}>
                      <View style={styles.missionTag}>
                        <Image
                          source={BROOM_ICON}
                          style={styles.missionTagIcon}
                        />
                        <Text style={styles.missionTagText}>Mission</Text>
                      </View>
                      {isCreator && (
                        <View style={styles.missionLeaderTag}>
                          <Text style={styles.missionLeaderTagText}>
                            Squad leader
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.missionRelativeTime}>
                      {getRelativeTime(event.date)}
                    </Text>
                  </View>

                  <Text style={styles.missionTitleText}>{event.title}</Text>

                  <View style={styles.metaRow}>
                    <Image source={ICON_LOCATION} style={styles.metaIcon} />
                    <Text style={styles.missionMeta}>{event.location}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Image source={ICON_CLOCK} style={styles.metaIcon} />
                    <Text style={styles.missionMeta}>
                      {formatDate(event.date)} • Squad {event.participants.length}
                    </Text>
                  </View>

                  <Text
                    style={styles.missionDescription}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {event.description}
                  </Text>

                  {userStatus !== 'none' && (
                    <View
                      style={[
                        styles.rsvpState,
                        userStatus === 'confirmed'
                          ? styles.rsvpStateConfirmed
                          : styles.rsvpStateDeclined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rsvpStateText,
                          userStatus === 'confirmed'
                            ? styles.rsvpStateTextConfirmed
                            : styles.rsvpStateTextDeclined,
                        ]}
                      >
                        {userStatus === 'confirmed'
                          ? "You're in"
                          : 'You skipped this mission'}
                      </Text>
                    </View>
                  )}

                  {!isCreator && canRSVP && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        onPress={() => rsvpToEvent(event.id, 'confirm')}
                        style={styles.iconActionButton}
                      >
                        <Text style={styles.iconActionText}>✓</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => rsvpToEvent(event.id, 'decline')}
                        style={[
                          styles.iconActionButton,
                          styles.iconActionButtonSecondary,
                        ]}
                      >
                        <Text style={styles.iconActionTextSecondary}>✕</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.footerTip}>
          <Text
            style={[
              textStyles.bodySmall,
              { textAlign: 'center', color: colors.muted },
            ]}
          >
            Pro tip: stack missions near hotspots for bigger impact.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.confettiContainer} pointerEvents="none">
          {showSuccessModal && (
            <ConfettiCannon
              key={confettiKey}
              count={160}
              origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
              fadeOut
              explosionSpeed={350}
              fallSpeed={3000}
            />
          )}
        </View>

        <CleanTownModal
          title="Mission launched"
          subtitle="Your cleanup is live. Share it with your Community."
          icon={ICON_SUCCESS}
          onClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.pointsPillSuccess}>
            <Text style={styles.pointsLabel}>Launch bonus</Text>
            <Text style={styles.pointsValue}>+50 XP</Text>
          </View>

          <Pressable
            onPress={() => {
              playSound(BUTTON_PRESS_SOUND);
              setShowSuccessModal(false);
            }}
            style={styles.successButton}
          >
            <Text style={styles.successButtonText}>Great!</Text>
          </Pressable>
        </CleanTownModal>
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
    paddingBottom: spacing(6),
  },

  header: {
    marginBottom: spacing(3),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing(1),
    marginBottom: spacing(1),
  },
  headerMascot: {
    width: 140,
    height: 140,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pointsBackground,
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    gap: spacing(1),
    ...shadows.sm,
  },
  pointsPillIcon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  pointsPillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.ink,
  },
  title: {
    fontFamily: 'CherryBomb-One',
    fontSize: 32,
    color: '#2A7390',
    textAlign: 'center',
    marginBottom: spacing(0.5),
  },
  sectionHeading: {
    fontFamily: 'CherryBomb-One',
    fontSize: 18,
    color: '#2A7390',
    marginBottom: spacing(0.2),
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing(2),
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing(1.5),
    marginBottom: spacing(3),
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing(1.5),
    marginBottom: spacing(2),
  },
  tile: {
    flex: 1,
    backgroundColor: colors.homeMain,
    borderRadius: radius.lg,
    borderWidth: 0,
    padding: spacing(2),
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  tileIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  tileSubtext: {
    ...textStyles.bodySmall,
    color: colors.muted,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FDFDF2',
    borderRadius: radius.lg,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    ...shadows.sm,
  },
  statLabel: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginBottom: spacing(0.5),
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.ink,
  },

  containerBox: {
    backgroundColor: '#FDFDF2',
    borderRadius: radius.lg,
    padding: spacing(3),
    marginBottom: spacing(4),
    ...shadows.lg,
  },

  formCard: {
    backgroundColor: '#FDFDF2',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FDFDF2',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2.5),
    marginBottom: spacing(3),
    ...shadows.sm,
  },
  formTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 20,
    color: '#2A7390',
    marginBottom: spacing(1.5),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    marginBottom: spacing(1.5),
    borderWidth: 1.5,
    borderColor: colors.primary + '20',
  },
  fieldRowMultiline: {
    alignItems: 'flex-start',
  },
  fieldIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginRight: spacing(1.5),
    marginTop: 2,
  },
  fieldInput: {
    flex: 1,
    ...textStyles.bodySmall,
    padding: 0,
  },
  placesHint: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginTop: -spacing(0.5),
    marginLeft: spacing(1),
    fontSize: 12,
  },
  placesDropdown: {
    marginTop: spacing(0.75),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '33',
    ...shadows.sm,
    overflow: 'hidden',
  },
  placesItem: {
    paddingVertical: spacing(1.2),
    paddingHorizontal: spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '12',
  },
  placesItemText: {
    ...textStyles.bodySmall,
    color: colors.ink,
  },
  fieldInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },

  dateTimeInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
    marginBottom: spacing(2.5),
    marginTop: spacing(0.5),
  },
  dateTimeLabelCol: {
    flex: 1,
  },
  datePillLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.6),
  },
  datePillIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  datePillLabel: {
    ...textStyles.bodySmall,
    color: colors.muted,
  },
  dateTimeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  dateIconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.primary + '22',
  },
  dateTimeIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  selectedDateText: {
    ...textStyles.bodySmall,
    marginTop: spacing(0.5),
    color: colors.ink,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  launchButton: {
    backgroundColor: '#ffffff',
    paddingVertical: spacing(2.2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.xl,
    ...shadows.md,
    borderWidth: 2,
    borderColor: '#45A569',
    marginTop: spacing(0.5),
  },
  launchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1.5),
  },
  launchIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  launchIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  launchText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#1C2530',
  },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
  },
  listCountPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(0.75),
    borderRadius: 999,
  },
  listCountText: {
    ...textStyles.bodySmall,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },

  upcomingTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 16,
    color: '#2A7390',
  },
  missionTitleText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1C2530',
    marginBottom: spacing(0.5),
  },

  missionRow: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing(2.5),
    marginBottom: spacing(2),
    ...shadows.sm,
    position: 'relative',
  },
  missionRowCreator: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  missionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1),
  },
  missionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    flexWrap: 'wrap',
  },
  missionTag: {
    backgroundColor: colors.idTrash,
    paddingHorizontal: spacing(1.2),
    paddingVertical: spacing(0.4),
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.6),
  },
  missionTagIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  missionTagText: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins_600SemiBold',
  },
  missionLeaderTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.4),
    borderRadius: 999,
  },
  missionLeaderTagText: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  missionRelativeTime: {
    ...textStyles.bodySmall,
    color: colors.muted,
  },

  missionMeta: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginBottom: spacing(0.25),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.6),
    marginBottom: spacing(0.25),
  },
  metaIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  missionDescription: {
    ...textStyles.bodySmall,
    marginTop: spacing(1),
    marginBottom: spacing(1.5),
  },
  statusRibbon: {
    position: 'absolute',
    top: spacing(1),
    right: spacing(1),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(0.5),
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.4),
    borderRadius: 999,
    ...shadows.sm,
  },
  statusRibbonText: {
    ...textStyles.bodySmall,
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },
  statusIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },

  rsvpState: {
    padding: spacing(1.5),
    borderRadius: radius.md,
    marginBottom: spacing(1.5),
  },
  rsvpStateConfirmed: {
    backgroundColor: '#106593',
  },
  rsvpStateDeclined: {
    backgroundColor: colors.danger + '20',
  },
  rsvpStateText: {
    ...textStyles.bodySmall,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  rsvpStateTextConfirmed: {
    color: '#ffffff',
  },
  rsvpStateTextDeclined: {
    color: colors.danger,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing(1.5),
  },

  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#72C55D',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  iconActionButtonSecondary: {
    backgroundColor: '#FDFDF2',
    borderWidth: 1,
    borderColor: colors.muted,
  },

  iconActionText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#1C2530',
  },

  iconActionTextSecondary: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.muted,
  },

  // SUCCESS MODAL
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
  },
  successCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing(3),
    alignItems: 'center',
    ...shadows.md,
  },
  successIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: spacing(2),
  },
  pointsPillSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F0E8D8',
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    marginTop: spacing(1.5),
    marginBottom: spacing(2),
    gap: spacing(1),
  },
  pointsLabel: {
    ...textStyles.bodySmall,
    color: colors.muted,
    marginRight: spacing(0.5),
  },
  pointsValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.primaryDark,
  },
  successButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(4),
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  successButtonText: {
    ...textStyles.bodySmall,
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },

  emptyState: {
    padding: spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTip: {
    backgroundColor: colors.card,
    padding: spacing(2.5),
    borderRadius: radius.lg,
    marginTop: spacing(3),
    ...shadows.sm,
  },

  modalTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 24,
    color: '#2A7390',
    textAlign: 'center',
    marginBottom: spacing(0.5),
  },
  modalSubtitle: {
    ...textStyles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing(2),
  },
});

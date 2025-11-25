import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Pressable,
  Text,
  Linking,
  Alert,
  Modal,
  Image,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  Callout,
} from 'react-native-maps';
import * as Location from 'expo-location';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { colors, spacing, shadows, textStyles, radius } from '@/theme';
import { useNavigation } from '@react-navigation/native';
import { pointsActions } from '@/services/points';
import { CleanTownModal } from '@/components/CleanTownModal';

const ICON_ALERT = require('../../assets/emergency_alert.png');
const ICON_CONFIRM = require('../../assets/tick.png');
const ICON_HAZARD = require('../../assets/hazard.png');
const ICON_RECYCLE = require('../../assets/cleantown-recycling.png');
const ICON_LOCATION = require('../../assets/location.png');
const ICON_MAP = require('../../assets/green_map.png');
const ICON_LITTER = require('../../assets/cleantown-sad-littter.png');

const modalTitleStyle = {
  fontFamily: 'CherryBomb-One',
  fontSize: 24,
  color: '#2A7390',
  textAlign: 'center' as const,
  marginBottom: spacing(0.5),
};

const screenTitleStyle = {
  fontFamily: 'CherryBomb-One',
  fontSize: 32,
  color: '#2A7390',
  textAlign: 'center' as const,
  marginBottom: spacing(0.5),
};

interface ReportWithLocation {
  id: string;
  userId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  lat?: number;
  lng?: number;
  note?: string;
  description?: string;
  category?: string;
  status?: string;
  type?: string;
  hasPhoto?: boolean;
  hasAudio?: boolean;
  createdAt?: any;
  confirmations?: {
    stillThere: number;
    notThere: number;
    lastConfirmedAt: any;
  };
}

const getMarkerTintColor = (status: string) => {
  switch (status) {
    case 'urgent':
      return colors.danger;
    case 'cleaned':
      return colors.primary;
    case 'needs-confirmation':
    default:
      return colors.accent;
  }
};

const getMarkerStatus = (item: ReportWithLocation) => {
  const confirmations = item.confirmations;
  if (!confirmations) return 'needs-confirmation';

  const totalConfirmations =
    (confirmations.stillThere || 0) + (confirmations.notThere || 0);

  if (totalConfirmations >= 3) {
    if ((confirmations.notThere || 0) > (confirmations.stillThere || 0)) {
      return 'cleaned';
    } else {
      return 'urgent';
    }
  }

  return 'needs-confirmation';
};

const CustomMarker = ({ status }: { status: string }) => {
  const ring = getMarkerTintColor(status);

  return (
    <View
      style={{
        padding: 2,
        borderRadius: 24,
        backgroundColor: ring + '33',
        borderWidth: 3,
        borderColor: ring,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    >
      <Image
        source={ICON_LITTER}
        style={{
          width: 36,
          height: 36,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
};

export default function MapShare() {
  const nav = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [reports, setReports] = useState<ReportWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] =
    useState<ReportWithLocation | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false);
  const [lastConfirmStatus, setLastConfirmStatus] =
    useState<'stillThere' | 'notThere' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError(
            'Location permission needed to show your position on the map'
          );
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        const initialRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.008, // closer
          longitudeDelta: 0.004,
        };

        setRegion(initialRegion);

        setTimeout(() => {
          mapRef.current?.animateToRegion(initialRegion, 600);
        }, 300);
      } catch (err) {
        console.error('Location error:', err);
        setError('Failed to get your location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

      const unsub = onSnapshot(
        q,
        snap => {
          const items: ReportWithLocation[] = [];
          snap.forEach(d => {
            try {
              const data = d.data();
              items.push({
                id: d.id,
                ...data,
              } as ReportWithLocation);
            } catch (e) {
              console.error('Error processing report:', e);
            }
          });
          setReports(items);
        },
        err => {
          console.error('Firestore error:', err);
          setError('Failed to load reports: ' + err.message);
        }
      );

      return unsub;
    } catch (err) {
      console.error('Firestore setup error:', err);
      setError('Failed to setup reports listener');
    }
  }, []);

  const getCoordinates = (item: ReportWithLocation) => {
    try {
      if (
        item.location?.lat !== undefined &&
        item.location?.lng !== undefined
      ) {
        return {
          lat: item.location.lat,
          lng: item.location.lng,
        };
      }
      if (item.lat !== undefined && item.lng !== undefined) {
        return {
          lat: item.lat,
          lng: item.lng,
        };
      }
      return null;
    } catch (err) {
      console.error('Error getting coordinates for report:', item.id, err);
      return null;
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url).catch(err => {
      console.error('Failed to open maps:', err);
      Alert.alert('Error', 'Could not open maps app');
    });
  };

  const confirmIncident = async (
    reportId: string,
    status: 'stillThere' | 'notThere'
  ) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to confirm incidents.'
        );
        return;
      }

      const reportRef = doc(db, 'reports', reportId);

      await updateDoc(reportRef, {
        [`confirmations.${status}`]: increment(1),
        'confirmations.lastConfirmedAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await pointsActions.confirmStatus(
        uid,
        status === 'stillThere' ? 'still there' : 'not there'
      );

      setConfirmationModal(false);
      setSelectedReport(null);

      setLastConfirmStatus(status);
      setShowConfirmSuccess(true);
    } catch (err) {
      console.error('Error confirming incident:', err);
      Alert.alert('Error', 'Failed to submit confirmation');
    }
  };

  const showConfirmationDialog = (report: ReportWithLocation) => {
    setSelectedReport(report);
    setConfirmationModal(true);
  };

  const getMarkerTitle = (item: ReportWithLocation) =>
    item.note || item.description || 'Cleanup Report';

  const getMarkerDescription = (item: ReportWithLocation) => {
    const parts: string[] = [];
    if (item.category) parts.push(item.category);
    if (item.hasPhoto) parts.push('Photo attached');
    if (item.hasAudio) parts.push('Audio attached');

    const confirmations = item.confirmations;
    if (confirmations) {
      parts.push(
        `Still there: ${confirmations.stillThere || 0} | Not there: ${
          confirmations.notThere || 0
        }`
      );
    }

    const status = getMarkerStatus(item);
    if (status === 'urgent') parts.push('Needs Cleanup');
    if (status === 'cleaned') parts.push('Cleaned');

    return parts.join(' • ') || 'Tap to confirm status';
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.homeMain,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            textStyles.body,
            { marginTop: spacing(2), color: colors.muted },
          ]}
        >
          Loading map...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.homeMain }}>
<Modal
  visible={confirmationModal}
  transparent
  animationType="fade"
  onRequestClose={() => setConfirmationModal(false)}
>
  <CleanTownModal
    title="Confirm incident"
    subtitle="Is this dumping still at this spot?"
  >
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing(2),
        marginTop: spacing(1),
      }}
    >
      {/* STILL THERE */}
      <Pressable
        onPress={() =>
          selectedReport &&
          confirmIncident(selectedReport.id, 'stillThere')
        }
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          paddingVertical: spacing(2),
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.danger + '55',
          ...shadows.sm,
        }}
      >
        <Image
          source={ICON_ALERT}
          style={{
            width: 36,
            height: 36,
            resizeMode: 'contain',
            marginBottom: spacing(0.75),
          }}
        />
        <Text
          style={{
            ...textStyles.bodySmall,
            color: colors.danger,
            fontFamily: 'Poppins_600SemiBold',
          }}
        >
          Still there
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          selectedReport &&
          confirmIncident(selectedReport.id, 'notThere')
        }
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          paddingVertical: spacing(2),
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.primary + '55',
          ...shadows.sm,
        }}
      >
        <Image
          source={ICON_CONFIRM}
          style={{
            width: 36,
            height: 36,
            resizeMode: 'contain',
            marginBottom: spacing(0.75),
          }}
        />
        <Text
          style={{
            ...textStyles.bodySmall,
            color: colors.primaryDark,
            fontFamily: 'Poppins_600SemiBold',
          }}
        >
          Not there
        </Text>
      </Pressable>
    </View>

    {/* CANCEL */}
    <Pressable
      onPress={() => setConfirmationModal(false)}
      style={{
        marginTop: spacing(3),
        padding: spacing(1.5),
        alignItems: 'center',
      }}
    >
      <Text style={[textStyles.bodySmall, { color: colors.muted }]}>
        Cancel
      </Text>
    </Pressable>
  </CleanTownModal>
</Modal>

      <Modal
        visible={showConfirmSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmSuccess(false)}
      >
        <CleanTownModal
          icon={lastConfirmStatus === 'stillThere' ? ICON_ALERT : ICON_CONFIRM}
          title="Confirmation submitted"
          subtitle={
            lastConfirmStatus === 'stillThere'
              ? 'Thanks! This hotspot stays active so others know it still needs attention.'
              : 'Nice! We’ll mark this area as cleaned so the map stays up to date.'
          }
          onClose={() => setShowConfirmSuccess(false)}
          showCloseTextButton
        >
          {/* points pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'center',
              backgroundColor: '#F0E8D8',
              borderRadius: 999,
              paddingHorizontal: spacing(2),
              paddingVertical: spacing(1),
              marginTop: spacing(1.5),
            }}
          >
            <Text
              style={[
                textStyles.bodySmall,
                { color: colors.muted, marginRight: spacing(1) },
              ]}
            >
              Community XP
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins-Bold',
                fontSize: 14,
                color: colors.primaryDark,
              }}
            >
              +30 pts
            </Text>
          </View>
        </CleanTownModal>
      </Modal>

      {region ? (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#1D4ED8',
                  borderWidth: 3,
                  borderColor: '#BFDBFE',
                }}
              />
            </Marker>
          )}

          {/* Cleanup markers */}
          {reports.map(item => {
            const coords = getCoordinates(item);
            if (!coords) return null;

            const status = getMarkerStatus(item);

            return (
            <Marker
              key={item.id}
              coordinate={{
                latitude: coords.lat,
                longitude: coords.lng,
              }}
              title={getMarkerTitle(item)}
              description={getMarkerDescription(item)}
              onPress={() => {
                mapRef.current?.animateToRegion(
                  {
                    latitude: coords.lat,
                    longitude: coords.lng,
                    latitudeDelta: 0.006,
                    longitudeDelta: 0.003,
                  },
                  300
                );

                showConfirmationDialog(item);
              }}
            >
              <CustomMarker status={status} />
              <Callout tooltip>
                  <View
                    style={{
                      backgroundColor: colors.background,
                      padding: spacing(3),
                      borderRadius: radius.lg,
                      minWidth: 250,
                      ...shadows.lg,
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                  >
                    <Text
                      style={[textStyles.h3, { marginBottom: spacing(1) }]}
                    >
                      {getMarkerTitle(item)}
                    </Text>
                    <Text
                      style={[
                        textStyles.bodySmall,
                        {
                          color: colors.muted,
                          marginBottom: spacing(2),
                        },
                      ]}
                    >
                      {getMarkerDescription(item)}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: spacing(1),
                        marginBottom: spacing(2),
                      }}
                    >
                  <Pressable
  onPress={() => showConfirmationDialog(item)}
  style={{
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing(2),
    borderRadius: radius.sm,
    alignItems: 'center',
    ...shadows.sm,
  }}
>
  <Text
    style={[
      textStyles.bodySmall,
      {
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
      },
    ]}
  >
    Confirm Status
  </Text>
</Pressable>


                      <Pressable
                        onPress={() => openInMaps(coords.lat, coords.lng)}
                        style={{
                          backgroundColor: colors.card,
                          padding: spacing(2),
                          borderRadius: radius.sm,
                          alignItems: 'center',
                          ...shadows.sm,
                        }}
                      >
                        <Text
                          style={[
                            textStyles.bodySmall,
                            {
                              color: colors.primary,
                              fontFamily: 'Poppins_600SemiBold',
                            },
                          ]}
                        >
                          Navigate
                        </Text>
                      </Pressable>
                    </View>

                    {status === 'urgent' && (
                      <View
                        style={{
                          backgroundColor: colors.danger + '20',
                          padding: spacing(1),
                          borderRadius: radius.sm,
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing(0.5),
                          }}
                        >
                          <Image
                            source={ICON_HAZARD}
                            style={{
                              width: 18,
                              height: 18,
                              resizeMode: 'contain',
                            }}
                          />
                          <Text
                            style={[
                              textStyles.bodySmall,
                              {
                                color: colors.danger,
                                fontFamily: 'Poppins_600SemiBold',
                              },
                            ]}
                          >
                            Needs Immediate Attention
                          </Text>
                        </View>
                      </View>
                    )}

                    {status === 'cleaned' && (
                      <View
                        style={{
                          backgroundColor: colors.primary + '20',
                          padding: spacing(1),
                          borderRadius: radius.sm,
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: spacing(0.5),
                          }}
                        >
                          <Image
                            source={ICON_RECYCLE}
                            style={{
                              width: 18,
                              height: 18,
                              resizeMode: 'contain',
                            }}
                          />
                          <Text
                            style={[
                              textStyles.bodySmall,
                              {
                                color: colors.primary,
                                fontFamily: 'Poppins_600SemiBold',
                              },
                            ]}
                          >
                            Area Cleaned
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.homeMain,
          }}
        >
          <Text
            style={[
              textStyles.body,
              { color: colors.muted, textAlign: 'center' },
            ]}
          >
            Map not available{'\n'}Location permission required
          </Text>
        </View>
      )}

      {location && (
        <Pressable
          onPress={() => {
            const newRegion: Region = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.003,
            };
            mapRef.current?.animateToRegion(newRegion, 600);
          }}
          style={{
            position: 'absolute',
            bottom: spacing(14),
            right: spacing(3),
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            ...shadows.lg,
          }}
        >
          <Image
            source={ICON_LOCATION}
            style={{ width: 22, height: 22, resizeMode: 'contain' }}
          />
        </Pressable>
      )}

      <Pressable
        onPress={() => nav.navigate('Report')}
        style={{
          position: 'absolute',
          bottom: spacing(8),
          right: spacing(3),
          backgroundColor: colors.leaderboard,
          paddingVertical: spacing(2),
          paddingHorizontal: spacing(3),
          borderRadius: 999,
          ...shadows.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing(1.5),
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={require('../../assets/report-icon.png')}
            style={{ width: 24, height: 24, resizeMode: 'contain' }}
          />
        </View>

        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Poppins-Bold',
            fontSize: 16,
          }}
        >
          Report
        </Text>
      </Pressable>

      <View
        style={{
          position: 'absolute',
          top: spacing(3),
          left: spacing(3),
          right: spacing(3),
          backgroundColor: colors.background,
          padding: spacing(3),
          borderRadius: radius.lg,
          ...shadows.lg,
          borderWidth: 2,
          borderColor: colors.primary,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing(1),
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing(1),
            }}
          >
            <Image
              source={ICON_MAP}
              style={{ width: 28, height: 28, resizeMode: 'contain' }}
            />
            <Text style={screenTitleStyle}>Cleanup Map</Text>
          </View>
          <View
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing(2),
              paddingVertical: spacing(1),
              borderRadius: radius.sm,
            }}
          >
            <Text
              style={[
                textStyles.body,
                { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
              ]}
            >
              {reports.length} Reports
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing(1),
            marginBottom: spacing(1),
          }}
        >
          <Image
            source={ICON_LOCATION}
            style={{ width: 18, height: 18, resizeMode: 'contain' }}
          />
          <Text style={[textStyles.bodySmall, { color: colors.muted }]}>
            {location
              ? `Your location: ${location.coords.latitude.toFixed(
                  4
                )}, ${location.coords.longitude.toFixed(4)}`
              : 'Location permission needed'}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing(2),
            flexWrap: 'wrap',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: colors.accent,
                borderRadius: 6,
                marginRight: 4,
              }}
            />
            <Text style={[textStyles.bodySmall, { color: colors.muted }]}>
              Needs Confirmation
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: colors.danger,
                borderRadius: 6,
                marginRight: 4,
              }}
            />
            <Text style={[textStyles.bodySmall, { color: colors.muted }]}>
              Urgent
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: colors.primary,
                borderRadius: 6,
                marginRight: 4,
              }}
            />
            <Text style={[textStyles.bodySmall, { color: colors.muted }]}>
              Cleaned
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

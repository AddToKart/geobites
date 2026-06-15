import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { getVendors, updateVendor } from '../../services/vendorService';
import { Colors } from '../../utils/colors';
import { AppButton } from '../../components/common/AppButton';

export function SellerShopScreen() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [latitude, setLatitude] = useState(14.8214);
  const [longitude, setLongitude] = useState(120.9565);

  const loadVendor = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const vendorsRes = await getVendors({ page: 1, limit: 100 });
      const myVendor = vendorsRes.data.find((v) => v.userId === user.id);
      if (myVendor) {
        setVendor(myVendor);
        setName(myVendor.name);
        setDescription(myVendor.description || '');
        setAddress(myVendor.address);
        setIsActive(myVendor.isActive);
        setLatitude(Number(myVendor.latitude) || 14.8214);
        setLongitude(Number(myVendor.longitude) || 120.9565);
      }
    } catch (err: any) {
      console.error('Error loading store profile:', err);
      Alert.alert('Error', 'Failed to load store profile information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVendor();
  }, [user]);

  const handleSave = async () => {
    if (!vendor) return;
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Store name cannot be empty.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Store address cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateVendor(vendor.id, {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        isActive,
        latitude,
        longitude,
      });
      setVendor(updated);
      Alert.alert('Success', 'Store profile successfully updated!');
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to update store profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading store profile...</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No Store Registered</Text>
        <Text style={styles.errorText}>
          You do not have a registered store profile yet. Please contact support or check backend seeds.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      {/* Ambient background blobs for Glassmorphic design */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Shop Customization</Text>
        <Text style={styles.subtitle}>
          Manage your live merchant details that customers see in the Santa Maria marketplace.
        </Text>

        <View style={styles.formCard}>
          {/* Active Switch */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Store Status</Text>
              <Text style={styles.switchSubtitle}>
                {isActive ? 'Accepting online orders' : 'Closed for new orders'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#767577', true: Colors.primaryLight }}
              thumbColor={isActive ? Colors.primaryDark : '#f4f3f4'}
            />
          </View>

          {/* Store Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Pancit Baryo"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Address Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Store address in Santa Maria, Bulacan"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Map Location Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Location (Drag to update pin)</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.0121,
                }}
                key={vendor?.id || 'default'}
              >
                <Marker
                  draggable
                  coordinate={{ latitude, longitude }}
                  onDragEnd={(e) => {
                    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  title={name || 'Shop Location'}
                  description="Drag this marker to your shop location"
                  pinColor={Colors.primary}
                />
              </MapView>
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What makes your food special?..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Save Button */}
          <View style={styles.buttonWrapper}>
            {saving ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <AppButton label="Save Changes" onPress={handleSave} />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  container: {
    padding: 16,
    paddingTop: 54, // Safe space for status bar notch since header is hidden
    gap: 12,
  },
  bgBlob1: {
    position: 'absolute',
    top: 40,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    opacity: 0.42,
    zIndex: -1,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.accent,
    opacity: 0.38,
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.bgPrimary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 16,
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    paddingBottom: 14,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonWrapper: {
    marginTop: 8,
  },
});

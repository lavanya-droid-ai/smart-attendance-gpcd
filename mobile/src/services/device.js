import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export async function getDeviceId() {
  if (Platform.OS === 'android') {
    return Application.getAndroidId();
  }

  // iOS: use a combination of identifiers
  const installId = await Application.getIosIdForVendorAsync();
  return installId;
}

export async function getDeviceInfo() {
  const deviceId = await getDeviceId();
  return {
    brand: Device.brand,
    model: Device.modelName,
    osVersion: `${Platform.OS} ${Device.osVersion}`,
    deviceId,
    isDevice: Device.isDevice,
  };
}

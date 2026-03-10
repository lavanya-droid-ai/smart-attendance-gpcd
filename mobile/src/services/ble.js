/*
 * BLE Service – scaffold with placeholders.
 * Full BLE peripheral/central implementation will be wired up
 * once react-native-ble-plx native modules are built with EAS.
 */

export const BLE_SERVICE_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const BLE_CHAR_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

let isScanning = false;
let isBroadcasting = false;

export async function startBroadcasting(sessionToken) {
  // TODO: Use BleManager from react-native-ble-plx to advertise
  // the session token as a BLE peripheral.
  // This requires a native build (EAS) – won't work in Expo Go.
  console.log('[BLE] startBroadcasting placeholder – token:', sessionToken);
  isBroadcasting = true;
  return { success: true, message: 'BLE broadcasting started (placeholder)' };
}

export async function stopBroadcasting() {
  console.log('[BLE] stopBroadcasting placeholder');
  isBroadcasting = false;
  return { success: true };
}

export async function startScanning(onTokenFound) {
  // TODO: Use BleManager to scan for peripherals advertising
  // BLE_SERVICE_UUID, read the characteristic, and call onTokenFound(token).
  console.log('[BLE] startScanning placeholder');
  isScanning = true;

  // Simulate finding a token after 3 seconds in dev
  if (__DEV__) {
    setTimeout(() => {
      if (isScanning && onTokenFound) {
        onTokenFound('dev-simulated-token');
      }
    }, 3000);
  }

  return { success: true, message: 'BLE scanning started (placeholder)' };
}

export async function stopScanning() {
  console.log('[BLE] stopScanning placeholder');
  isScanning = false;
  return { success: true };
}

export function getStatus() {
  return { isScanning, isBroadcasting };
}

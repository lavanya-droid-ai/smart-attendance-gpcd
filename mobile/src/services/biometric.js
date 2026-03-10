import * as LocalAuthentication from 'expo-local-authentication';

export async function checkBiometricAvailability() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) {
    return { available: false, reason: 'Device does not support biometric authentication' };
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    return { available: false, reason: 'No biometrics enrolled on this device' };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return {
    available: true,
    types: types.map((t) => {
      switch (t) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'face';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'iris';
        default:
          return 'unknown';
      }
    }),
  };
}

export async function authenticate() {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity for attendance',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      error: result.error || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Biometric authentication failed',
    };
  }
}

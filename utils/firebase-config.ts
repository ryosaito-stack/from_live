/**
 * Firebase設定の診断ユーティリティ
 */

interface FirebaseConfigValidation {
  isValid: boolean
  missingKeys: string[]
  config: Record<string, string> | null
  error: string | null
}

export function validateFirebaseConfig(): FirebaseConfigValidation {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }

  const missingKeys = Object.entries(config)
    .filter(([key, value]) => !value || value === 'undefined')
    .map(([key]) => key)

  if (missingKeys.length > 0) {
    console.error('Missing Firebase configuration:', missingKeys)
    return {
      isValid: false,
      missingKeys,
      config: null,
      error: `Missing Firebase environment variables: ${missingKeys.join(', ')}`,
    }
  }

  return {
    isValid: true,
    missingKeys: [],
    config,
    error: null,
  }
}

export function getFirebaseDebugInfo() {
  const validation = validateFirebaseConfig()
  
  return {
    ...validation,
    environment: process.env.NODE_ENV,
    hasWindow: typeof window !== 'undefined',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
  }
}
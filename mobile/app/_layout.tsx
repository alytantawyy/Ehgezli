import FontAwesome from '@expo/vector-icons/FontAwesome';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useSegments, useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../context/auth-context';
import { LocationProvider } from '../context/location-context';
import { ThemeProvider } from '../context/theme-context';
import { Asset } from 'expo-asset';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

// Preload assets function
const preloadAssets = async () => {
  const images = [
    require('../assets/icon.png'),
    require('../assets/adaptive-icon.png'),
    require('../assets/splash-icon.png'),
    require('../assets/favicon.png'),
  ];
  
  // Preload all images
  const imageAssets = images.map(image => Asset.fromModule(image).downloadAsync());
  
  await Promise.all([...imageAssets]);
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // State to track if assets are loaded
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Load assets
  useEffect(() => {
    async function prepare() {
      try {
        await preloadAssets();
        setAssetsLoaded(true);
      } catch (e) {
        console.warn('Error preloading assets:', e);
        // Continue anyway
        setAssetsLoaded(true);
      }
    }

    prepare();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && assetsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, assetsLoaded]);

  if (!loaded || !assetsLoaded) {
    return null;
  }

  return <RootLayoutNav />;
}

// Auth protection wrapper component
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Wait for navigation to be ready
  useEffect(() => {
    // Mark navigation as ready after initial render
    const timeout = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Skip redirects when still loading auth state or navigation isn't ready
    if (isLoading || !isNavigationReady) return;

    // Define protected routes - all routes except login
    const isProtectedRoute = pathname !== '/login';

    if (!user && isProtectedRoute) {
      // Redirect to login if not authenticated and trying to access a protected route
      router.replace('/login');
    } else if (user && pathname === '/login') {
      // Redirect to home if already authenticated and trying to access login
      router.replace('/');
    }
  }, [user, segments, isLoading, pathname, isNavigationReady]);

  // Show nothing while loading or redirecting
  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <AuthWrapper>
              <Stack>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false, headerTitle: 'Ehgezli' }} />
                <Stack.Screen name="restaurant/[id]" options={{ headerTitle: 'Restaurant Details' }} />
              </Stack>
            </AuthWrapper>
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

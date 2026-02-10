import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ---------------------------------------------------------------------------
// Root Stack – the top-level navigator
// ---------------------------------------------------------------------------
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PostDetail: { postId: string };
  Profile: { username: string };
};

// ---------------------------------------------------------------------------
// Auth Stack – nested inside Root when user is not authenticated
// ---------------------------------------------------------------------------
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ---------------------------------------------------------------------------
// Main Tabs – nested inside Root when user is authenticated
// ---------------------------------------------------------------------------
export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

// ---------------------------------------------------------------------------
// Screen props helpers
// ---------------------------------------------------------------------------

/** Props for screens that live directly in the Root Stack */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/** Props for screens inside the Auth stack (nested under Root) */
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

/** Props for screens inside the Main bottom-tab navigator (nested under Root) */
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

// ---------------------------------------------------------------------------
// Augment the global react-navigation namespace so useNavigation / useRoute
// are fully typed without extra generics at every call site.
// ---------------------------------------------------------------------------
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

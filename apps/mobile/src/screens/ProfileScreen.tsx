// ============================================================================
// 1Ummah Mobile -- ProfileScreen
// Displays the authenticated user's profile with banner, avatar, stats,
// bio, and a logout button.
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LogOut, BadgeCheck } from 'lucide-react-native';
import { api } from '../lib/api-client';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import type { User, ApiResponse } from '../lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatStat(n: number | undefined): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser, logout } = useAuth();

  const username = authUser?.username ?? '';

  const { data, isLoading } = useQuery<ApiResponse<User>>({
    queryKey: ['user', username],
    queryFn: () => api.get<ApiResponse<User>>(`/api/v1/users/${username}`),
    enabled: !!username,
  });

  const profile = data?.data ?? authUser;

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.loaderContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, styles.loaderContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Could not load profile.</Text>
      </View>
    );
  }

  const isVerified = profile.isVerified;

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerGradient} />
      </View>

      {/* Avatar -- overlapping the banner */}
      <View style={styles.avatarWrapper}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>
              {getInitials(profile.displayName)}
            </Text>
          </View>
        )}
      </View>

      {/* Name row */}
      <View style={styles.nameRow}>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        {isVerified && (
          <BadgeCheck
            size={18}
            color={colors.brand}
            style={styles.verifiedBadge}
          />
        )}
      </View>
      <Text style={styles.username}>@{profile.username}</Text>

      {/* Bio */}
      {profile.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : null}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatStat(profile.postsCount)}
          </Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatStat(profile.followingCount)}
          </Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatStat(profile.followersCount)}
          </Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const AVATAR_SIZE = 80;
const BANNER_HEIGHT = 120;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },

  // Banner
  banner: {
    height: BANNER_HEIGHT,
    backgroundColor: colors.bgCard,
  },
  bannerGradient: {
    flex: 1,
    backgroundColor: colors.bgHover,
    // Simple dark gradient effect
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
    opacity: 0.5,
  },

  // Avatar
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -(AVATAR_SIZE / 2),
    marginBottom: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  avatarFallback: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },

  // Name
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  displayName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  verifiedBadge: {
    marginLeft: spacing.xs,
  },
  username: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Bio
  bio: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing.lg,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    marginBottom: spacing['2xl'],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: colors.border,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  logoutText: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});

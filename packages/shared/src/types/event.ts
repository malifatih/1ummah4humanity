export interface Event {
  id: string;
  creatorId: string;
  groupId?: string;
  title: string;
  description?: string;
  location?: string;
  isOnline: boolean;
  onlineUrl?: string;
  startTime: string;
  endTime?: string;
  bannerUrl?: string;
  attendeeCount: number;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  isAttending?: boolean;
}

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  isOnline?: boolean;
  onlineUrl?: string;
  startTime: string;
  endTime?: string;
  groupId?: string;
  bannerUrl?: string;
}

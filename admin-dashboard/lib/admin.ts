export interface AdminStats {
  totalUsers: number;
  totalStories: number;
  activeStories: number;
  createdAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface AdminDashboardState {
  selectedTab: 'overview' | 'users' | 'stories' | 'settings';
  stats: AdminStats;
  users: AdminUser[];
  lastUpdated: Date;
}

export function createStats(): AdminStats {
  return {
    totalUsers: 0,
    totalStories: 0,
    activeStories: 0,
    createdAt: new Date()
  };
}

export function incrementUsers(stats: AdminStats): AdminStats {
  return { ...stats, totalUsers: stats.totalUsers + 1 };
}

export function incrementStories(stats: AdminStats): AdminStats {
  return { ...stats, totalStories: stats.totalStories + 1 };
}

export function createAdminUser(email: string, role: string): AdminUser {
  return {
    id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    email,
    role,
    isAdmin: true,
    createdAt: new Date()
  };
}

export function createDashboardState(): AdminDashboardState {
  return {
    selectedTab: 'overview',
    stats: createStats(),
    users: [],
    lastUpdated: new Date()
  };
}

export function setTab(state: AdminDashboardState, tab: AdminDashboardState['selectedTab']): AdminDashboardState {
  return { ...state, selectedTab: tab, lastUpdated: new Date() };
}

export function addUser(state: AdminDashboardState, user: AdminUser): AdminDashboardState {
  return { ...state, users: [...state.users, user], lastUpdated: new Date() };
}

export function removeUser(state: AdminDashboardState, userId: string): AdminDashboardState {
  return {
    ...state,
    users: state.users.filter(u => u.id !== userId),
    lastUpdated: new Date()
  };
}
import { describe, it, expect } from '@jest/globals';
import { AdminStats, createStats, incrementUsers, incrementStories, createAdminUser, createDashboardState, setTab, addUser, removeUser } from '../lib/admin';

describe('AdminStats', () => {
  it('should create stats with initial values', () => {
    const stats = createStats();

    expect(stats.totalUsers).toBe(0);
    expect(stats.totalStories).toBe(0);
    expect(stats.activeStories).toBe(0);
  });

  it('should increment users', () => {
    const stats = createStats();
    const updated = incrementUsers(stats);

    expect(updated.totalUsers).toBe(1);
  });

  it('should increment stories', () => {
    const stats = createStats();
    const updated = incrementStories(stats);

    expect(updated.totalStories).toBe(1);
  });

  it('should not mutate original', () => {
    const original = createStats();
    incrementUsers(original);

    expect(original.totalUsers).toBe(0);
  });
});

describe('AdminUser', () => {
  it('should create admin user', () => {
    const user = createAdminUser('admin@example.com', 'admin');

    expect(user.email).toBe('admin@example.com');
    expect(user.role).toBe('admin');
    expect(user.id).toBeDefined();
  });

  it('should have isAdmin flag', () => {
    const user = createAdminUser('admin@example.com', 'admin');

    expect(user.isAdmin).toBe(true);
  });

  it('should generate unique id', () => {
    const user1 = createAdminUser('user1@example.com', 'member');
    const user2 = createAdminUser('user2@example.com', 'member');

    expect(user1.id).not.toBe(user2.id);
  });
});

describe('AdminDashboardState', () => {
  it('should track selected tab', () => {
    const state = createDashboardState();

    expect(state.selectedTab).toBe('overview');
  });

  it('should change tab', () => {
    const state = createDashboardState();

    const updated = setTab(state, 'users');

    expect(updated.selectedTab).toBe('users');
  });

  it('should add user', () => {
    const state = createDashboardState();
    const user = createAdminUser('new@example.com', 'member');

    const updated = addUser(state, user);

    expect(updated.users).toHaveLength(1);
    expect(updated.users[0].email).toBe('new@example.com');
  });

  it('should not mutate original when adding user', () => {
    const state = createDashboardState();
    const user = createAdminUser('new@example.com', 'member');

    addUser(state, user);

    expect(state.users).toHaveLength(0);
  });

  it('should remove user by id', () => {
    const user = createAdminUser('remove@example.com', 'member');
    const state = { ...createDashboardState(), users: [user] };

    const updated = removeUser(state, user.id);

    expect(updated.users).toHaveLength(0);
  });

  it('should not mutate original when removing user', () => {
    const user = createAdminUser('remove@example.com', 'member');
    const state = { ...createDashboardState(), users: [user] };

    removeUser(state, user.id);

    expect(state.users).toHaveLength(1);
  });

  it('should only remove matching user id', () => {
    const user1 = createAdminUser('user1@example.com', 'member');
    const user2 = createAdminUser('user2@example.com', 'member');
    const state = { ...createDashboardState(), users: [user1, user2] };

    const updated = removeUser(state, user1.id);

    expect(updated.users).toHaveLength(1);
    expect(updated.users[0].id).toBe(user2.id);
  });

  it('should update lastUpdated on tab change', () => {
    const state = createDashboardState();
    const originalLastUpdated = state.lastUpdated;

    // Wait a tiny bit to ensure time difference
    const updated = setTab(state, 'users');

    expect(updated.lastUpdated.getTime()).toBeGreaterThanOrEqual(originalLastUpdated.getTime());
  });

  it('should update lastUpdated on add user', () => {
    const state = createDashboardState();
    const user = createAdminUser('new@example.com', 'member');

    const updated = addUser(state, user);

    expect(updated.lastUpdated).toBeDefined();
  });

  it('should update lastUpdated on remove user', () => {
    const user = createAdminUser('remove@example.com', 'member');
    const state = { ...createDashboardState(), users: [user] };

    const updated = removeUser(state, user.id);

    expect(updated.lastUpdated).toBeDefined();
  });
});
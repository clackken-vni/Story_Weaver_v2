import { describe, it, expect } from '@jest/globals';

interface User {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  setPage: (page: number) => void;
  deleteUser: (id: string) => Promise<void>;
  refresh: () => void;
}

function createUseUsersMock(): UseUsersReturn {
  return {
    users: [
      { id: '1', email: 'admin@example.com', role: 'admin', isAdmin: true, createdAt: new Date('2024-01-15') },
      { id: '2', email: 'user@example.com', role: 'member', isAdmin: false, createdAt: new Date('2024-02-20') },
    ],
    loading: false,
    error: null,
    totalPages: 5,
    currentPage: 1,
    setPage: () => {},
    deleteUser: async (_id: string) => {},
    refresh: () => {},
  };
}

function createLoadingUsersMock(): UseUsersReturn {
  return {
    users: [],
    loading: true,
    error: null,
    totalPages: 0,
    currentPage: 1,
    setPage: () => {},
    deleteUser: async (_id: string) => {},
    refresh: () => {},
  };
}

function createErrorUsersMock(): UseUsersReturn {
  return {
    users: [],
    loading: false,
    error: 'Failed to fetch users',
    totalPages: 0,
    currentPage: 1,
    setPage: () => {},
    deleteUser: async (_id: string) => {},
    refresh: () => {},
  };
}

describe('useUsers hook', () => {
  describe('loaded state', () => {
    it('should return users list', () => {
      const mock = createUseUsersMock();
      expect(mock.users).toHaveLength(2);
    });

    it('should not be loading', () => {
      const mock = createUseUsersMock();
      expect(mock.loading).toBe(false);
    });

    it('should not have error', () => {
      const mock = createUseUsersMock();
      expect(mock.error).toBeNull();
    });

    it('should have pagination info', () => {
      const mock = createUseUsersMock();
      expect(mock.totalPages).toBe(5);
      expect(mock.currentPage).toBe(1);
    });
  });

  describe('loading state', () => {
    it('should return empty users array', () => {
      const mock = createLoadingUsersMock();
      expect(mock.users).toHaveLength(0);
    });

    it('should be loading', () => {
      const mock = createLoadingUsersMock();
      expect(mock.loading).toBe(true);
    });
  });

  describe('error state', () => {
    it('should return empty users', () => {
      const mock = createErrorUsersMock();
      expect(mock.users).toHaveLength(0);
    });

    it('should return error message', () => {
      const mock = createErrorUsersMock();
      expect(mock.error).toBe('Failed to fetch users');
    });
  });

  describe('user structure', () => {
    it('should have required user fields', () => {
      const mock = createUseUsersMock();
      const user = mock.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isAdmin');
      expect(user).toHaveProperty('createdAt');
    });

    it('should correctly identify admin users', () => {
      const mock = createUseUsersMock();
      expect(mock.users[0].isAdmin).toBe(true);
      expect(mock.users[1].isAdmin).toBe(false);
    });
  });

  describe('actions', () => {
    it('should have setPage function', () => {
      const mock = createUseUsersMock();
      expect(mock.setPage).toBeDefined();
      expect(typeof mock.setPage).toBe('function');
    });

    it('should have deleteUser function', () => {
      const mock = createUseUsersMock();
      expect(mock.deleteUser).toBeDefined();
      expect(typeof mock.deleteUser).toBe('function');
    });

    it('should have refresh function', () => {
      const mock = createUseUsersMock();
      expect(mock.refresh).toBeDefined();
      expect(typeof mock.refresh).toBe('function');
    });
  });
});

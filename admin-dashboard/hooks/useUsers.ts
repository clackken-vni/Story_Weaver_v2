import { useState, useEffect, useCallback } from 'react';
import { adminApi, User } from '../lib/api';

export interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  deleteUser: (id: string) => Promise<void>;
  refresh: () => void;
}

const DEFAULT_PAGE_SIZE = 10;

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getUsers(currentPage, pageSize);
      setUsers(response.users);
      setTotalCount(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = useCallback(async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    const nextPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(nextPage);
  }, [totalPages]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  return {
    users,
    loading,
    error,
    totalPages,
    totalCount,
    currentPage,
    pageSize,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    deleteUser: handleDeleteUser,
    refresh: fetchUsers,
  };
}

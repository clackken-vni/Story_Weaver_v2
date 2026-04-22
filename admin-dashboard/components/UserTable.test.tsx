import { describe, it, expect } from '@jest/globals';

interface User {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

function UserTable({ users, onDelete, onEdit }: UserTableProps) {
  if (users.length === 0) {
    return '<div class="empty-state">No users found</div>';
  }

  const rows = users.map(user => `
    <tr data-user-id="${user.id}">
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${user.isAdmin ? 'Admin' : 'Member'}</td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        ${onEdit ? `<button class="edit-btn" data-action="edit" data-id="${user.id}">Edit</button>` : ''}
        ${onDelete ? `<button class="delete-btn" data-action="delete" data-id="${user.id}">Delete</button>` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <table class="user-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Role</th>
          <th>Type</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

describe('UserTable', () => {
  const mockUsers: User[] = [
    { id: '1', email: 'admin@example.com', role: 'admin', isAdmin: true, createdAt: '2024-01-15' },
    { id: '2', email: 'user@example.com', role: 'member', isAdmin: false, createdAt: '2024-02-20' },
  ];

  it('should render user table with data', () => {
    const html = UserTable({ users: mockUsers });
    expect(html).toContain('admin@example.com');
    expect(html).toContain('user@example.com');
    expect(html).toContain('admin');
    expect(html).toContain('Member');
  });

  it('should render empty state when no users', () => {
    const html = UserTable({ users: [] });
    expect(html).toContain('No users found');
  });

  it('should show Admin label for admin users', () => {
    const html = UserTable({ users: [mockUsers[0]] });
    expect(html).toContain('Admin');
  });

  it('should show Member label for non-admin users', () => {
    const html = UserTable({ users: [mockUsers[1]] });
    expect(html).toContain('Member');
  });

  it('should render edit button when onEdit provided', () => {
    const handleEdit = () => {};
    const html = UserTable({ users: mockUsers, onEdit: handleEdit });
    expect(html).toContain('Edit');
  });

  it('should not render edit button when onEdit not provided', () => {
    const html = UserTable({ users: mockUsers });
    expect(html).not.toContain('edit-btn');
  });

  it('should render delete button when onDelete provided', () => {
    const handleDelete = () => {};
    const html = UserTable({ users: mockUsers, onDelete: handleDelete });
    expect(html).toContain('Delete');
  });

  it('should not render delete button when onDelete not provided', () => {
    const html = UserTable({ users: mockUsers });
    expect(html).not.toContain('delete-btn');
  });

  it('should render user data attributes for actions', () => {
    const handleDelete = () => {};
    const html = UserTable({ users: mockUsers, onDelete: handleDelete });
    expect(html).toContain('data-user-id="1"');
    expect(html).toContain('data-user-id="2"');
  });

  it('should format date correctly', () => {
    const html = UserTable({ users: [mockUsers[0]] });
    expect(html).toContain('1/15/2024');
  });

  it('should handle user with special characters in email', () => {
    const specialUser: User = {
      id: '3',
      email: 'user+tag@example.com',
      role: 'member',
      isAdmin: false,
      createdAt: '2024-03-01',
    };
    const html = UserTable({ users: [specialUser] });
    expect(html).toContain('user+tag@example.com');
  });
});

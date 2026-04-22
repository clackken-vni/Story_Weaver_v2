import { Shield, User as UserIcon, Lock, MoreHorizontal } from 'lucide-react';
import { DataTable, type DataTableColumn } from './ui/DataTable';

export interface User {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserTableProps {
  users: User[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function UserTable({ users, loading = false, onDelete, onEdit }: UserTableProps) {
  const columns: DataTableColumn<User>[] = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      sortValue: (user) => user.email,
      render: (user) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <UserIcon size={14} aria-hidden="true" />
          <span>{user.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      sortValue: (user) => user.role,
      render: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span style={{ color: user.isAdmin ? 'var(--status-healthy)' : 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          {user.isAdmin ? 'Admin access' : 'Member access'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      sortable: true,
      sortValue: (user) => new Date(user.createdAt).getTime(),
      render: (user) => (
        <time dateTime={user.createdAt} style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {new Date(user.createdAt).toLocaleDateString()}
        </time>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (user) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {onEdit && (
            <button type="button" onClick={() => onEdit(user.id)} style={actionButtonStyle()}>
              Edit
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={() => onDelete(user.id)} style={actionButtonStyle('danger')}>
              Delete
            </button>
          )}
          <button type="button" style={actionButtonStyle()} aria-label={`More actions for ${user.email}`}>
            <MoreHorizontal size={14} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable<User>
      data={users}
      loading={loading}
      emptyLabel="No users found"
      rowKey={(user) => user.id}
      columns={columns}
      mobileCard={(user) => (
        <article
          style={{
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--card-radius)',
            padding: 'var(--space-3)',
            background: 'var(--card-bg)',
            display: 'grid',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
            <strong style={{ fontSize: 'var(--text-sm)' }}>{user.email}</strong>
            <RoleBadge role={user.role} />
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            Created {new Date(user.createdAt).toLocaleDateString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: user.isAdmin ? 'var(--status-healthy)' : 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              {user.isAdmin ? 'Admin' : 'Member'}
            </span>
            <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
              {onEdit && (
                <button type="button" onClick={() => onEdit(user.id)} style={actionButtonStyle()}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={() => onDelete(user.id)} style={actionButtonStyle('danger')}>
                  Delete
                </button>
              )}
            </div>
          </div>
        </article>
      )}
    />
  );
}

function RoleBadge({ role }: { role: string }) {
  const normalized = role.toLowerCase();
  const palette =
    normalized === 'super_admin'
      ? { text: 'var(--role-super-admin)', bg: 'oklch(0.58 0.2 300 / 0.12)', icon: Shield }
      : normalized === 'admin'
        ? { text: 'var(--role-admin)', bg: 'oklch(0.62 0.18 245 / 0.12)', icon: Shield }
        : normalized === 'locked'
          ? { text: 'var(--role-locked)', bg: 'var(--status-critical-bg)', icon: Lock }
          : { text: 'var(--role-user)', bg: 'var(--status-unknown-bg)', icon: UserIcon };

  const Icon = palette.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        color: palette.text,
        background: palette.bg,
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
      }}
    >
      <Icon size={12} aria-hidden="true" />
      {role}
    </span>
  );
}

function actionButtonStyle(variant: 'default' | 'danger' = 'default') {
  return {
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-md)',
    background: variant === 'danger' ? 'var(--status-critical-bg)' : 'var(--surface-tertiary)',
    color: variant === 'danger' ? 'var(--status-critical)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    padding: '4px 8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
  } as const;
}

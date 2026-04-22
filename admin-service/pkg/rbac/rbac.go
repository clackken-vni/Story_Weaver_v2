package rbac

type Permission string

const (
	PermissionUsersRead   Permission = "users:read"
	PermissionUsersWrite  Permission = "users:write"
	PermissionUsersDelete Permission = "users:delete"
	PermissionStoriesRead  Permission = "stories:read"
	PermissionStoriesWrite Permission = "stories:write"
)

type Role struct {
	Name        string
	Permissions  []Permission
}

func NewRoleAdmin() *Role {
	return &Role{
		Name: "admin",
		Permissions: []Permission{
			PermissionUsersRead,
			PermissionUsersWrite,
		},
	}
}

func NewRoleSuperAdmin() *Role {
	return &Role{
		Name: "super_admin",
		Permissions: []Permission{
			PermissionUsersRead,
			PermissionUsersWrite,
			PermissionUsersDelete,
			PermissionStoriesRead,
			PermissionStoriesWrite,
		},
	}
}

func (r *Role) HasPermission(perm Permission) bool {
	for _, p := range r.Permissions {
		if p == perm {
			return true
		}
	}
	return false
}

func CheckPermission(role *Role, perm Permission) bool {
	return role.HasPermission(perm)
}
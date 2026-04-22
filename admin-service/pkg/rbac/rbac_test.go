package rbac_test

import (
	"testing"

	"storyweaver/admin-service/pkg/rbac"
)

func TestPermission_String(t *testing.T) {
	tests := []struct {
		perm    rbac.Permission
		want    string
	}{
		{rbac.PermissionUsersRead, "users:read"},
		{rbac.PermissionUsersWrite, "users:write"},
		{rbac.PermissionUsersDelete, "users:delete"},
		{rbac.PermissionStoriesRead, "stories:read"},
		{rbac.PermissionStoriesWrite, "stories:write"},
	}

	for _, tt := range tests {
		if string(tt.perm) != tt.want {
			t.Errorf("Permission %v: expected %s, got %s", tt.perm, tt.want, string(tt.perm))
		}
	}
}

func TestRole_HasPermission(t *testing.T) {
	admin := rbac.NewRoleAdmin()
	superAdmin := rbac.NewRoleSuperAdmin()

	// Admin should have users:read and users:write
	if !admin.HasPermission(rbac.PermissionUsersRead) {
		t.Error("admin should have users:read")
	}
	if !admin.HasPermission(rbac.PermissionUsersWrite) {
		t.Error("admin should have users:write")
	}
	if admin.HasPermission(rbac.PermissionUsersDelete) {
		t.Error("admin should NOT have users:delete")
	}

	// SuperAdmin should have all
	if !superAdmin.HasPermission(rbac.PermissionUsersDelete) {
		t.Error("super_admin should have users:delete")
	}
}

func TestNewRoleAdmin(t *testing.T) {
	role := rbac.NewRoleAdmin()

	if len(role.Permissions) != 2 {
		t.Errorf("expected 2 permissions, got %d", len(role.Permissions))
	}
}

func TestNewRoleSuperAdmin(t *testing.T) {
	role := rbac.NewRoleSuperAdmin()

	if len(role.Permissions) != 5 {
		t.Errorf("expected 5 permissions, got %d", len(role.Permissions))
	}
}

func TestCheckPermission(t *testing.T) {
	admin := rbac.NewRoleAdmin()
	superAdmin := rbac.NewRoleSuperAdmin()

	// Check with correct role
	if !rbac.CheckPermission(admin, rbac.PermissionUsersRead) {
		t.Error("should return true for valid permission")
	}

	// Check with wrong permission
	if rbac.CheckPermission(admin, rbac.PermissionUsersDelete) {
		t.Error("should return false for invalid permission")
	}

	// SuperAdmin has all
	if !rbac.CheckPermission(superAdmin, rbac.PermissionUsersDelete) {
		t.Error("super_admin should have all permissions")
	}
}
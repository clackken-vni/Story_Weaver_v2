package admin

import "sort"

const capabilitiesReadAll = "admin.read.*"
const capabilitiesWriteAll = "admin.write.*"

var roleCapabilities = map[string][]string{
	"super_admin": {
		capabilitiesReadAll,
		capabilitiesWriteAll,
		"admin.incident.manage",
		"admin.user.manage",
		"admin.audit.export",
		"admin.settings.write",
		"admin.settings.rollback",
	},
	"admin": {
		capabilitiesReadAll,
		"admin.write.users",
		"admin.incident.manage",
		"admin.settings.read",
	},
	"ops": {
		capabilitiesReadAll,
		"admin.incident.manage",
	},
}

func ResolveCapabilities(role string) []string {
	caps, ok := roleCapabilities[role]
	if !ok {
		return []string{}
	}
	out := append([]string(nil), caps...)
	sort.Strings(out)
	return out
}

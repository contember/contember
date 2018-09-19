import { Acl, Model } from 'cms-common'

export default class AllowAllPermissionFactory {
	create(schema: Pick<Model.Schema, 'entities'>): Acl.Permissions {
		const permissions: Acl.Permissions = {}
		for (let entityName in schema.entities) {
			if (!schema.entities.hasOwnProperty(entityName)) {
				continue
			}

			const fieldPermissions = Object.keys(schema.entities[entityName].fields).reduce(
				(permissions: Acl.FieldPermissions, fieldName): Acl.FieldPermissions => {
					return { ...permissions, [fieldName]: true }
				},
				{}
			)

			permissions[entityName] = {
				predicates: {},
				operations: {
					read: fieldPermissions,
					update: fieldPermissions,
					create: fieldPermissions,
					delete: true,
				},
			}
		}

		return permissions
	}
}

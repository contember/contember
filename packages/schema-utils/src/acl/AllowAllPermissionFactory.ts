import { Acl, Model } from '@contember/schema'

export class AllowAllPermissionFactory {
	constructor(
		private readonly operations: Acl.Operation[] = [
			Acl.Operation.read,
			Acl.Operation.update,
			Acl.Operation.delete,
			Acl.Operation.create,
		],
	) {}

	create(schema: Pick<Model.Schema, 'entities'>, allowCustomPrimary = false): Acl.Permissions {
		const permissions: Acl.Permissions = {}
		for (let entityName in schema.entities) {
			if (!schema.entities.hasOwnProperty(entityName)) {
				continue
			}

			const fieldPermissions = Object.keys(schema.entities[entityName].fields).reduce(
				(permissions: Acl.FieldPermissions, fieldName): Acl.FieldPermissions => {
					return { ...permissions, [fieldName]: true }
				},
				{},
			)

			permissions[entityName] = {
				predicates: {},
				operations: {
					read: this.operations.includes(Acl.Operation.read) ? fieldPermissions : {},
					update: this.operations.includes(Acl.Operation.update) ? fieldPermissions : {},
					create: this.operations.includes(Acl.Operation.create) ? fieldPermissions : {},
					...(this.operations.includes(Acl.Operation.delete)
						? {
								delete: true,
						  }
						: {}),
					...(allowCustomPrimary ? { customPrimary: true } : {}),
				},
			}
		}

		return permissions
	}
}

import { Fragment, h } from 'preact'
import { Acl } from '@contember/schema'
import { SinglePermission } from './SinglePermission'

export const FieldPermissions  = ({ entityPermissions, field }: { entityPermissions?: Acl.EntityPermissions; field: string }) => {
	const readPermissions = entityPermissions?.operations.read?.[field]
	const updatePermissions = entityPermissions?.operations.update?.[field]
	const createPermissions = entityPermissions?.operations.create?.[field]
	return <Fragment>
		<SinglePermission value={'C'} predicate={createPermissions} />
		<SinglePermission value={'R'} predicate={readPermissions} />
		<SinglePermission value={'U'} predicate={updatePermissions} />
	</Fragment>
}

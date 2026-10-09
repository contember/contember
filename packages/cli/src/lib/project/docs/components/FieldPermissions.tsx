import { Fragment, h } from 'preact'
import { Acl } from '@contember/schema'
import { splitEntityPermissions } from '@contember/schema-utils'
import { SinglePermission } from './SinglePermission.js'

type FieldOperation = Acl.Operation.create | Acl.Operation.read | Acl.Operation.update

const FieldPermission = ({ split, operation, field, value }: {
	split?: ReturnType<typeof splitEntityPermissions>
	operation: FieldOperation
	field: string
	value: string
}) => {
	const rootPredicate = split?.root.operations[operation]?.[field]
	const throughPredicate = split?.through.operations[operation]?.[field]
	return <SinglePermission value={value} predicate={rootPredicate || throughPredicate} throughOnly={!rootPredicate && !!throughPredicate} />
}

export const FieldPermissions = ({ entityPermissions, field }: { entityPermissions?: Acl.EntityPermissions; field: string }) => {
	const split = entityPermissions ? splitEntityPermissions(entityPermissions) : undefined
	return (
		<Fragment>
			<FieldPermission split={split} operation={Acl.Operation.create} field={field} value={'C'} />
			<FieldPermission split={split} operation={Acl.Operation.read} field={field} value={'R'} />
			<FieldPermission split={split} operation={Acl.Operation.update} field={field} value={'U'} />
		</Fragment>
	)
}

export const DeletePermission = ({ entityPermissions }: { entityPermissions?: Acl.EntityPermissions }) => {
	const split = entityPermissions ? splitEntityPermissions(entityPermissions) : undefined
	const rootPredicate = split?.root.operations.delete
	const throughPredicate = split?.through.operations.delete
	return <SinglePermission value={'D'} predicate={rootPredicate || throughPredicate} throughOnly={!rootPredicate && !!throughPredicate} />
}

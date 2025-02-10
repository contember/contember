import { c } from '@contember/schema-definition'

export const adminRole = c.createRole('admin')
export const noVarRole = c.createRole('noVar')
export const predefinedVariableRole = c.createRole('predefined')
export const conditionVariableRole = c.createRole('condition')
export const entityVariableRole = c.createRole('entity')

export const personIdVar = c.createPredefinedVariable('predefinedVar', 'personID', predefinedVariableRole)
export const branchVar = c.createEntityVariable('branchVar', 'AclBranch', entityVariableRole)
export const conditionVar = c.createConditionVariable('conditionVar', conditionVariableRole)

export class AclBranch {
	code = c.stringColumn().notNull().unique()
}
@c.Allow(adminRole, {
	read: ['canRead', 'canEdit', 'canReadSecondary'],
})
@c.Allow(adminRole, {
	when: { canRead: { eq: true } },
	read: ['primaryValue'],
})
@c.Allow(adminRole, {
	when: { canEdit: { eq: true } },
	update: ['primaryValue'],
})
@c.Allow(adminRole, {
	when: { canReadSecondary: { eq: true } },
	read: ['secondaryValue'],
})
export class AclRestrictedValue {
	canEdit = c.boolColumn().notNull()
	canRead = c.boolColumn().notNull()
	canReadSecondary = c.boolColumn().notNull()
	primaryValue = c.stringColumn()
	secondaryValue = c.stringColumn()
}

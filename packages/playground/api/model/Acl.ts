import { c } from '@contember/schema-definition'

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

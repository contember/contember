import * as AclDefinition from './acl/definition'
import * as ActionsDefinition from './actions/definition'
import * as InputValidation from './validation'
import { SchemaDefinition } from './model'
import { createSchema } from './createSchema'

export { AllowAllPermissionFactory } from '@contember/schema-utils'
export { PermissionsBuilder } from './acl/builder/PermissionsBuilder'
export * from './model'

export { AclDefinition, ActionsDefinition, SchemaDefinition, InputValidation, createSchema }

export const c = {
	allowCustomPrimary: AclDefinition.allowCustomPrimary,
	allow: AclDefinition.allow,
	createRole: AclDefinition.createRole,
	createConditionVariable: AclDefinition.createConditionVariable,
	createEntityVariable: AclDefinition.createEntityVariable,
	createPredefinedVariable: AclDefinition.createPredefinedVariable,
	canCreate: AclDefinition.canCreate,
	canRead: AclDefinition.canRead,
	canUpdate: AclDefinition.canUpdate,
	canDelete: AclDefinition.canDelete,

	watch: ActionsDefinition.watch,
	trigger: ActionsDefinition.trigger,
	createTarget: ActionsDefinition.createTarget,

	extendEntity: SchemaDefinition.extendEntity,
	createEnum: SchemaDefinition.createEnum,
	column: SchemaDefinition.column,
	boolColumn: SchemaDefinition.boolColumn,
	intColumn: SchemaDefinition.intColumn,
	doubleColumn: SchemaDefinition.doubleColumn,
	dateColumn: SchemaDefinition.dateColumn,
	dateTimeColumn: SchemaDefinition.dateTimeColumn,
	jsonColumn: SchemaDefinition.jsonColumn,
	stringColumn: SchemaDefinition.stringColumn,
	enumColumn: SchemaDefinition.enumColumn,
	uuidColumn: SchemaDefinition.uuidColumn,
	manyHasMany: SchemaDefinition.manyHasMany,
	manyHasManyInverse: SchemaDefinition.manyHasManyInverse,
	manyHasOne: SchemaDefinition.manyHasOne,
	oneHasOne: SchemaDefinition.oneHasOne,
	oneHasOneInverse: SchemaDefinition.oneHasOneInverse,
	oneHasMany: SchemaDefinition.oneHasMany,
	index: SchemaDefinition.index,
	unique: SchemaDefinition.unique,
	view: SchemaDefinition.view,
	disableEventLog: SchemaDefinition.disableEventLog,
	orderBy: SchemaDefinition.orderBy,

	assert: InputValidation.assert,
	required: InputValidation.required,
	assertDefined: InputValidation.assertDefined,
	assertNotEmpty: InputValidation.assertNotEmpty,
	assertPattern: InputValidation.assertPattern,
	assertMinLength: InputValidation.assertMinLength,
	assertMaxLength: InputValidation.assertMaxLength,
	validateWhen: InputValidation.when,
	rules: InputValidation.rules,
}

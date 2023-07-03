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

	// ACL
	// ACL entity decorators
	AllowCustomPrimary: AclDefinition.allowCustomPrimary,
	Allow: AclDefinition.allow,
	// ACL factories
	createRole: AclDefinition.createRole,
	createConditionVariable: AclDefinition.createConditionVariable,
	createEntityVariable: AclDefinition.createEntityVariable,
	createPredefinedVariable: AclDefinition.createPredefinedVariable,
	// ACL utilities
	canCreate: AclDefinition.canCreate,
	canRead: AclDefinition.canRead,
	canUpdate: AclDefinition.canUpdate,
	canDelete: AclDefinition.canDelete,


	// Actions
	// Actions entity decorators
	Watch: ActionsDefinition.watch,
	Trigger: ActionsDefinition.trigger,
	// Actions factories
	createActionsTarget: ActionsDefinition.createTarget,


	// Model
	// Model entity decorators
	ExtendEntity: SchemaDefinition.extendEntity,
	Index: SchemaDefinition.Index,
	Unique: SchemaDefinition.Unique,
	View: SchemaDefinition.View,
	DisableEventLog: SchemaDefinition.DisableEventLog,
	OrderBy: SchemaDefinition.OrderBy,
	// Model field factories
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
	// Model factories
	createEnum: SchemaDefinition.createEnum,


	// Validation
	// Validation field decorators
	Assert: InputValidation.assert,
	Required: InputValidation.required,
	AssertDefined: InputValidation.assertDefined,
	AssertNotEmpty: InputValidation.assertNotEmpty,
	AssertPattern: InputValidation.assertPattern,
	AssertMinLength: InputValidation.assertMinLength,
	AssertMaxLength: InputValidation.assertMaxLength,
	ValidateWhen: InputValidation.when,
	// Validation utilities
	rules: InputValidation.rules,

}

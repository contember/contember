import { Schema } from '@contember/schema'
import {
	compareArraysIgnoreOrder,
	deepCompare,
	isInverseRelation,
	isOwningRelation,
	isRelation,
	SchemaValidator,
	ValidationError,
} from '@contember/schema-utils'
import { SchemaMigrator } from './SchemaMigrator.js'
import { Migration } from './Migration.js'
import { ImplementationException } from './exceptions.js'
import {
	ConvertOneHasManyToManyHasManyRelationDiffer,
	ConvertOneToManyRelationDiffer,
	CreateColumnDiffer,
	CreateEntityDiffer,
	CreateEnumDiffer,
	CreateRelationDiffer,
	CreateRelationInverseSideDiffer,
	CreateUniqueConstraintDiffer,
	CreateViewDiffer,
	Differ,
	DisableOrphanRemovalDiffer,
	EnableOrphanRemovalDiffer,
	MakeRelationNotNullDiffer,
	MakeRelationNullableDiffer,
	RemoveEntityDiffer,
	RemoveEnumDiffer,
	RemoveFieldDiffer,
	RemoveUniqueConstraintDiffer,
	ToggleEntityImmutableDiffer,
	ToggleEventLogDiffer,
	ToggleJunctionEventLogDiffer,
	UpdateAclSchemaDiffer,
	UpdateColumnDefinitionDiffer,
	UpdateColumnNameDiffer,
	UpdateEntityOrderByDiffer,
	UpdateEntityTableNameDiffer,
	UpdateEnumDiffer,
	UpdateRelationOnDeleteDiffer,
	UpdateRelationOrderByDiffer,
	UpdateValidationSchemaDiffer,
	VERSION_LATEST,
} from './modifications/index.js'
import { RemoveChangedFieldDiffer, RemoveViewDiffer, UpdateViewDiffer } from './modifications/differs/index.js'
import { CreateIndexDiffer, RemoveIndexDiffer } from './modifications/indexes/index.js'
import { CreateTriggerDiffer, RemoveTriggerDiffer, UpdateTriggerDiffer } from './modifications/actions/index.js'
import { UpdateTargetDiffer } from './modifications/actions/UpdateTargetModification.js'
import { CreateTargetDiffer } from './modifications/actions/CreateTargetModification.js'
import { RemoveTargetDiffer } from './modifications/actions/RemoveTargetModification.js'
import { CreateRetentionPolicyDiffer } from './modifications/retention/CreateRetentionPolicyModification.js'
import { UpdateRetentionPolicyDiffer } from './modifications/retention/UpdateRetentionPolicyModification.js'
import { RemoveRetentionPolicyDiffer } from './modifications/retention/RemoveRetentionPolicyModification.js'
import { UpdateSettingsDiffer } from './modifications/settings/index.js'
import { RemoveIndexNamesDiffer } from './modifications/upgrade/RemoveIndexNamesModification.js'
import { ConvertOneHasManyToOneHasOneRelationDiffer } from './modifications/relations/ConvertOneHasManyToOneHasOneRelationModification.js'

export type DiffOptions = {
	skipRecreateValidation?: boolean
	skipInitialSchemaValidation?: boolean
	skipNonModelDiffers?: boolean
	/**
	 * Disable the in-place `CREATE OR REPLACE VIEW` optimization and drop & recreate every
	 * changed view (with its dependant cascade) instead. Escape hatch for views whose real
	 * output columns drifted without a matching field change (which would otherwise fail at
	 * execute time with `SQLSTATE 42P16`).
	 */
	recreateViews?: boolean
}

export class SchemaDiffer {
	constructor(
		private readonly schemaMigrator: SchemaMigrator,
		private readonly options?: {
			maxPatchSize?: number
		},
	) {}

	diffSchemas(originalSchema: Schema, updatedSchema: Schema, {
		skipInitialSchemaValidation = false,
		skipRecreateValidation = false,
		skipNonModelDiffers = false,
		recreateViews = false,
	}: DiffOptions = {}): Migration.Modification[] {
		if (!skipInitialSchemaValidation) {
			const originalErrors = SchemaValidator.validate(originalSchema)
			if (originalErrors.length > 0) {
				throw new InvalidSchemaException('original schema is not valid', originalErrors)
			}
		}
		const updatedErrors = SchemaValidator.validate(updatedSchema)
		if (updatedErrors.length > 0) {
			throw new InvalidSchemaException('updated schema is not valid', updatedErrors)
		}

		const differs: Differ[] = [
			new RemoveIndexNamesDiffer(),
			...skipNonModelDiffers ? [] : [new UpdateSettingsDiffer()],
			new ConvertOneToManyRelationDiffer(),
			new ConvertOneHasManyToManyHasManyRelationDiffer(),
			new ConvertOneHasManyToOneHasOneRelationDiffer(),
			new RemoveUniqueConstraintDiffer(),
			new RemoveIndexDiffer(),
			new RemoveViewDiffer(recreateViews),
			new RemoveEntityDiffer(),
			new RemoveFieldDiffer(),
			new CreateEnumDiffer(),
			new UpdateEntityTableNameDiffer(),
			new ToggleEventLogDiffer(),
			new ToggleJunctionEventLogDiffer(),
			new UpdateColumnDefinitionDiffer(),
			new UpdateColumnNameDiffer(),
			new UpdateRelationOnDeleteDiffer(),
			new MakeRelationNotNullDiffer(),
			new MakeRelationNullableDiffer(),
			new EnableOrphanRemovalDiffer(),
			new DisableOrphanRemovalDiffer(),
			new UpdateRelationOrderByDiffer(),
			new UpdateEnumDiffer(),
			new RemoveChangedFieldDiffer(it => !isRelation(it) || isOwningRelation(it)),
			new RemoveChangedFieldDiffer(it => isRelation(it) && isInverseRelation(it)),
			new CreateEntityDiffer(),
			new CreateColumnDiffer(),
			new CreateRelationDiffer(),
			new CreateViewDiffer(),
			...recreateViews ? [] : [new UpdateViewDiffer()],
			new CreateRelationInverseSideDiffer(),
			new CreateUniqueConstraintDiffer(),
			new CreateIndexDiffer(),
			new RemoveEnumDiffer(),
			...skipNonModelDiffers ? [] : [
				new UpdateAclSchemaDiffer(this.options),
				new UpdateValidationSchemaDiffer(this.options),
			],
			new UpdateEntityOrderByDiffer(),
			new ToggleEntityImmutableDiffer(),
			...skipNonModelDiffers ? [] : [
				new UpdateTargetDiffer(),
				new CreateTargetDiffer(),
				new UpdateTriggerDiffer(this.options),
				new CreateTriggerDiffer(),
				new RemoveTriggerDiffer(),
				new RemoveTargetDiffer(),
				new UpdateRetentionPolicyDiffer(),
				new CreateRetentionPolicyDiffer(),
				new RemoveRetentionPolicyDiffer(),
			],
		]

		const diffs: Migration.Modification[] = []
		let appliedDiffsSchema = originalSchema
		for (const differ of differs) {
			const differDiffs = differ.createDiff(appliedDiffsSchema, updatedSchema)
			appliedDiffsSchema = this.schemaMigrator.applyModifications(appliedDiffsSchema, differDiffs, VERSION_LATEST)
			diffs.push(...differDiffs)
		}

		if (!skipRecreateValidation) {
			const targetForCompare = skipNonModelDiffers
				? {
					...updatedSchema,
					acl: appliedDiffsSchema.acl,
					validation: appliedDiffsSchema.validation,
					actions: appliedDiffsSchema.actions,
					retention: appliedDiffsSchema.retention,
					settings: appliedDiffsSchema.settings,
				}
				: updatedSchema
			const errors = deepCompare(targetForCompare, appliedDiffsSchema, [], path => {
				if (path[0] === 'model' && path[1] === 'entities' && (path[3] === 'unique' || path[3] === 'index')) {
					return (a, b) => {
						return compareArraysIgnoreOrder(a, b, path)
					}
				}
				return null
			})
			if (errors.length === 0) {
				return diffs
			}
			let message = 'Updated schema cannot be recreated by the generated diff:'
			for (const err of errors) {
				message += '\n\t' + err.path.join('.') + ': ' + err.message
			}
			message += '\n\nPlease fill a bug report'
			throw new ImplementationException(message)
		}

		return diffs
	}
}

export class InvalidSchemaException extends Error {
	constructor(message: string, public readonly validationErrors: ValidationError[]) {
		super(message)
	}
}

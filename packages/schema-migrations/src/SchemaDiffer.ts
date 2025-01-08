import { Schema } from '@contember/schema'
import { compareArraysIgnoreOrder, deepCompare, isInverseRelation, isOwningRelation, isRelation, SchemaValidator, ValidationError } from '@contember/schema-utils'
import { SchemaMigrator } from './SchemaMigrator'
import { Migration } from './Migration'
import { ImplementationException } from './exceptions'
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
} from './modifications'
import { RemoveChangedFieldDiffer, RemoveViewDiffer } from './modifications/differs'
import { CreateIndexDiffer, RemoveIndexDiffer } from './modifications/indexes'
import { CreateTriggerDiffer, RemoveTriggerDiffer, UpdateTriggerDiffer } from './modifications/actions'
import { UpdateTargetDiffer } from './modifications/actions/UpdateTargetModification'
import { CreateTargetDiffer } from './modifications/actions/CreateTargetModification'
import { RemoveTargetDiffer } from './modifications/actions/RemoveTargetModification'
import { UpdateSettingsDiffer } from './modifications/settings'
import { RemoveIndexNamesDiffer } from './modifications/upgrade/RemoveIndexNamesModification'
import { ConvertOneHasManyToOneHasOneRelationDiffer } from './modifications/relations/ConvertOneHasManyToOneHasOneRelationModification'

type DiffOptions = { skipRecreateValidation?: boolean; skipInitialSchemaValidation?: boolean }

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
			new UpdateSettingsDiffer(),
			new ConvertOneToManyRelationDiffer(),
			new ConvertOneHasManyToManyHasManyRelationDiffer(),
			new ConvertOneHasManyToOneHasOneRelationDiffer(),
			new RemoveUniqueConstraintDiffer(),
			new RemoveIndexDiffer(),
			new RemoveViewDiffer(),
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
			new CreateRelationInverseSideDiffer(),
			new CreateUniqueConstraintDiffer(),
			new CreateIndexDiffer(),
			new RemoveEnumDiffer(),
			new UpdateAclSchemaDiffer(this.options),
			new UpdateValidationSchemaDiffer(this.options),
			new UpdateEntityOrderByDiffer(),
			new UpdateTargetDiffer(),
			new CreateTargetDiffer(),
			new UpdateTriggerDiffer(),
			new CreateTriggerDiffer(),
			new RemoveTriggerDiffer(),
			new RemoveTargetDiffer(),
		]

		const diffs: Migration.Modification[] = []
		let appliedDiffsSchema = originalSchema
		for (const differ of differs) {
			const differDiffs = differ.createDiff(appliedDiffsSchema, updatedSchema)
			appliedDiffsSchema = this.schemaMigrator.applyModifications(appliedDiffsSchema, differDiffs, VERSION_LATEST)
			diffs.push(...differDiffs)
		}

		if (!skipRecreateValidation) {
			const errors = deepCompare(updatedSchema, appliedDiffsSchema, [], path => {
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

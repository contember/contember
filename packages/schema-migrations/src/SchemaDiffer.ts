import { Schema } from '@contember/schema'
import {
	deepCompare,
	isInverseRelation,
	isOwningRelation,
	isRelation,
	SchemaValidator,
	ValidationError,
} from '@contember/schema-utils'
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
	UpdateEntityTableNameDiffer,
	UpdateEnumDiffer,
	UpdateRelationOnDeleteDiffer,
	UpdateRelationOrderByDiffer,
	UpdateValidationSchemaDiffer,
	VERSION_LATEST,
} from './modifications'
import { ChangeViewNonViewDiffer, RemoveChangedFieldDiffer, RemoveChangedViewDiffer } from './modifications/differs'
import { CreateIndexDiffer, RemoveIndexDiffer } from './modifications/indexes'
import { SchemaWithMeta } from './modifications/utils/schemaMeta'
import { UpdateSettingsDiffer } from './modifications/settings'

export class SchemaDiffer {
	constructor(private readonly schemaMigrator: SchemaMigrator) {}

	diffSchemas(originalSchema: Schema, updatedSchema: Schema, checkRecreate: boolean = true): Migration.Modification[] {
		const originalErrors = SchemaValidator.validate(originalSchema)
		if (originalErrors.length > 0) {
			throw new InvalidSchemaException('original schema is not valid', originalErrors)
		}
		const updatedErrors = SchemaValidator.validate(updatedSchema)
		if (updatedErrors.length > 0) {
			throw new InvalidSchemaException('updated schema is not valid', updatedErrors)
		}

		const differs: Differ[] = [
			new UpdateSettingsDiffer(),
			new ConvertOneToManyRelationDiffer(),
			new ConvertOneHasManyToManyHasManyRelationDiffer(),
			new RemoveUniqueConstraintDiffer(),
			new RemoveIndexDiffer(),
			new ChangeViewNonViewDiffer(),
			new RemoveChangedViewDiffer(),
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
			new CreateViewDiffer(),
			new CreateRelationDiffer(),
			new CreateRelationInverseSideDiffer(),
			new CreateUniqueConstraintDiffer(),
			new CreateIndexDiffer(),
			new RemoveEnumDiffer(),
			new UpdateAclSchemaDiffer(),
			new UpdateValidationSchemaDiffer(),
		]

		const diffs: Migration.Modification[] = []
		let appliedDiffsSchema = originalSchema
		for (const differ of differs) {
			const differDiffs = differ.createDiff(appliedDiffsSchema, updatedSchema)
			appliedDiffsSchema = this.schemaMigrator.applyModifications(appliedDiffsSchema, differDiffs, VERSION_LATEST)
			diffs.push(...differDiffs)
		}


		if (checkRecreate) {
			const { meta, ...appliedDiffsSchema2 } = appliedDiffsSchema as SchemaWithMeta
			const errors = deepCompare(updatedSchema, appliedDiffsSchema2, [])
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

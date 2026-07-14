import { Acl, Input, Model, Value } from '@contember/schema'
import { ObjectNode } from '../../inputProcessing/index.js'
import { createPredicateContext, PredicateFactory } from '../../acl/index.js'
import { assertNever } from '../../utils/index.js'

export interface RelationUpdatePredicates {
	readonly source?: Input.OptionalWhere
	readonly target?: Input.OptionalWhere
}

export const createRelationUpdatePredicates = (
	predicateFactory: PredicateFactory,
	context: Model.AnyRelationContext,
	sourceRelationPath: readonly Model.AnyRelationContext[],
): RelationUpdatePredicates => {
	const sourceScope = sourceRelationPath.length === 0 ? 'root' : 'through'
	const sourcePredicate = () =>
		predicateFactory.create(context.entity, Acl.Operation.update, [context.relation.name], createPredicateContext(sourceScope))
	const targetPredicate = (relation: Model.Relation) =>
		predicateFactory.create(context.targetEntity, Acl.Operation.update, [relation.name], createPredicateContext('through'))

	switch (context.type) {
		case 'manyHasOne':
		case 'oneHasOneOwning':
		case 'oneHasMany':
		case 'oneHasOneInverse':
			return { source: sourcePredicate() }
		case 'manyHasManyOwning':
		case 'manyHasManyInverse':
			return {
				source: sourcePredicate(),
				target: context.targetRelation === null ? undefined : targetPredicate(context.targetRelation),
			}
		default:
			return assertNever(context)
	}
}

export const containsUpdatableMetadata = (objectNode: ObjectNode): boolean => {
	for (const field of objectNode.fields) {
		if (!(field instanceof ObjectNode)) {
			continue
		}
		if (
			field.name === '_meta'
			&& field.fields.some(metaField => metaField instanceof ObjectNode && metaField.fields.some(info => info.name === Input.FieldMeta.updatable))
		) {
			return true
		}
		if (containsUpdatableMetadata(field)) {
			return true
		}
	}
	return false
}

const isValueObject = (value: Value.FieldValue | undefined): value is Value.Object =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

interface UpdatableMetadataPath {
	readonly metaAlias: string
	readonly fieldAlias: string
	readonly updatableAlias: string
}

interface NestedMetadataMasker {
	readonly fieldAlias: string
	readonly masker: MetadataUpdateMasker
}

export interface MetadataUpdateMasker {
	mask(value: Value.FieldValue): Value.FieldValue
	maskObject(value: Value.Object): Value.Object
}

export const createMetadataUpdateMasker = (objectNode: ObjectNode): MetadataUpdateMasker => {
	const metadataPaths: UpdatableMetadataPath[] = []
	const nestedMaskers: NestedMetadataMasker[] = []

	for (const field of objectNode.fields) {
		if (!(field instanceof ObjectNode)) {
			continue
		}
		if (field.name === '_meta') {
			for (const metaField of field.fields) {
				if (!(metaField instanceof ObjectNode)) {
					continue
				}
				for (const infoField of metaField.fields) {
					if (infoField.name === Input.FieldMeta.updatable) {
						metadataPaths.push({
							metaAlias: field.alias,
							fieldAlias: metaField.alias,
							updatableAlias: infoField.alias,
						})
					}
				}
			}
		} else if (containsUpdatableMetadata(field)) {
			nestedMaskers.push({ fieldAlias: field.alias, masker: createMetadataUpdateMasker(field) })
		}
	}

	const maskObject = (value: Value.Object): Value.Object => {
		const masked: { [key: string]: Value.FieldValue } = {}
		for (const [fieldName, fieldValue] of Object.entries(value)) {
			if (fieldValue !== undefined) {
				masked[fieldName] = fieldValue
			}
		}
		for (const path of metadataPaths) {
			const meta = masked[path.metaAlias]
			if (!isValueObject(meta)) {
				continue
			}
			const fieldMeta = meta[path.fieldAlias]
			if (!isValueObject(fieldMeta)) {
				continue
			}
			masked[path.metaAlias] = {
				...meta,
				[path.fieldAlias]: { ...fieldMeta, [path.updatableAlias]: false },
			}
		}
		for (const nested of nestedMaskers) {
			const nestedValue = masked[nested.fieldAlias]
			if (nestedValue !== undefined) {
				masked[nested.fieldAlias] = nested.masker.mask(nestedValue)
			}
		}
		return masked
	}
	const mask = (value: Value.FieldValue): Value.FieldValue => {
		if (Array.isArray(value)) {
			return value.map(mask)
		}
		return isValueObject(value) ? maskObject(value) : value
	}

	return { mask, maskObject }
}

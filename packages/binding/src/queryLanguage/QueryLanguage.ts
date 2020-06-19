import { Environment } from '../dao'
import { VariableInputTransformer } from '../model'
import {
	DesugaredHasManyRelation,
	DesugaredHasOneRelation,
	EntityListParameters,
	EntityName,
	FieldName,
	Filter,
	HasManyRelation,
	HasOneRelation,
	QualifiedEntityList,
	QualifiedFieldList,
	QualifiedSingleEntity,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	SugarableEntityListParameters,
	SugarableHasManyRelation,
	SugarableHasOneRelation,
	SugaredEntityConnections,
	SugaredFilter,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredQualifiedSingleEntity,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
	UnconstrainedQualifiedEntityList,
	UniqueWhere,
	UnsugarableEntityListParameters,
	UnsugarableHasManyRelation,
	UnsugarableHasOneRelation,
} from '../treeParameters'
import { Parser } from './Parser'

export namespace QueryLanguage {
	const preparePrimitiveEntryPoint = <Entry extends Parser.EntryPoint>(entryPoint: Entry) => (
		input: string | Parser.ParserResult[Entry],
		environment: Environment,
	): Parser.ParserResult[Entry] => {
		if (typeof input === 'string') {
			return Parser.parseQueryLanguageExpression(input, entryPoint, environment)
		}
		return input
	}

	const desugarSugarableUnconstrainedQualifiedEntityList = preparePrimitiveEntryPoint(
		Parser.EntryPoint.UnconstrainedQualifiedEntityList,
	)
	const desugarSugarableUnconstrainedQualifiedSingleEntity = preparePrimitiveEntryPoint(
		Parser.EntryPoint.UnconstrainedQualifiedEntityList,
	)
	const desugarSugarableQualifiedEntityList = preparePrimitiveEntryPoint(Parser.EntryPoint.QualifiedEntityList)
	const desugarSugarableQualifiedFieldList = preparePrimitiveEntryPoint(Parser.EntryPoint.QualifiedFieldList)
	const desugarSugarableQualifiedSingleEntity = preparePrimitiveEntryPoint(Parser.EntryPoint.QualifiedSingleEntity)
	const desugarSugarableRelativeEntityList = preparePrimitiveEntryPoint(Parser.EntryPoint.RelativeEntityList)
	const desugarSugarableRelativeSingleEntity = preparePrimitiveEntryPoint(Parser.EntryPoint.RelativeSingleEntity)
	const desugarSugarableRelativeSingleField = preparePrimitiveEntryPoint(Parser.EntryPoint.RelativeSingleField)

	const desugarEntityListParameters = (
		sugarablePart: SugarableEntityListParameters,
		unsugarablePart: UnsugarableEntityListParameters,
		environment: Environment,
	): EntityListParameters => ({
		filter: sugarablePart.filter ? desugarFilter(sugarablePart.filter, environment) : undefined,
		limit: unsugarablePart.limit,
		offset: unsugarablePart.offset,
		orderBy: unsugarablePart.orderBy ? desugarOrderBy(unsugarablePart.orderBy, environment) : undefined,
	})

	export const desugarConnections = (
		connections: SugaredEntityConnections,
		environment: Environment,
	): Map<string, UniqueWhere> => {
		if (connections instanceof Map) {
			return connections
		}
		return new Map(
			Object.entries(connections).map(([fieldName, uniqueWhere]) => [
				fieldName,
				desugarUniqueWhere(uniqueWhere, environment),
			]),
		)
	}

	const desugarHasOneRelation = (
		sugarable: SugarableHasOneRelation,
		unsugarable: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation => ({
		field: sugarable.field,
		filter: sugarable.filter ? desugarFilter(sugarable.filter, environment) : undefined,
		reducedBy: sugarable.reducedBy ? desugarUniqueWhere(sugarable.reducedBy, environment) : undefined,
		connections: unsugarable.connections ? desugarConnections(unsugarable.connections, environment) : undefined,
		isNonbearing: unsugarable.isNonbearing ?? false,
	})

	const augmentDesugaredHasOneRelationPath = (
		path: DesugaredHasOneRelation[],
		environment: Environment,
	): HasOneRelation[] => path.map(item => desugarHasOneRelation(item, {}, environment))

	const augmentDesugaredHasManyRelation = (
		relation: DesugaredHasManyRelation,
		unsugarable: UnsugarableHasManyRelation,
		environment: Environment,
	): HasManyRelation => ({
		field: relation.field,
		filter: relation.filter,
		isNonbearing: unsugarable.isNonbearing ?? false,
		connections: unsugarable.connections ? desugarConnections(unsugarable.connections, environment) : undefined,
		orderBy: unsugarable.orderBy ? desugarOrderBy(unsugarable.orderBy, environment) : undefined,
		offset: unsugarable.offset,
		limit: unsugarable.limit,
	})

	const desugarHasOneRelationPath = (
		input: SugarableHasOneRelation[] | SugarableHasOneRelation | undefined,
		lastRelation: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation[] => {
		if (input === undefined) {
			input = []
		} else if (!Array.isArray(input)) {
			input = [input]
		}

		const relationPath: HasOneRelation[] = []

		const cappedLength = input.length - 1
		let i = 0
		for (; i < cappedLength; i++) {
			// Deliberately leaving out the last element
			const pathNode = input[i]

			relationPath.push(desugarHasOneRelation(pathNode, {}, environment))
		}
		if (i in input) {
			relationPath.push(desugarHasOneRelation(input[i], lastRelation, environment))
		}

		return relationPath
	}

	const desugarHasManyRelation = (
		sugarablePart: SugarableHasManyRelation,
		unsugarablePart: UnsugarableHasManyRelation,
		environment: Environment,
	): HasManyRelation => ({
		...desugarEntityListParameters(sugarablePart, unsugarablePart, environment),
		connections: unsugarablePart.connections ? desugarConnections(unsugarablePart.connections, environment) : undefined,
		field: sugarablePart.field,
		isNonbearing: unsugarablePart.isNonbearing ?? false,
	})

	export const desugarUniqueWhere = preparePrimitiveEntryPoint(Parser.EntryPoint.UniqueWhere)
	export const desugarFilter: (
		input: string | Parser.ParserResult[Parser.EntryPoint.Filter],
		environment: Environment,
	) => Parser.ParserResult[Parser.EntryPoint.Filter] = preparePrimitiveEntryPoint(Parser.EntryPoint.Filter)
	export const desugarOrderBy = preparePrimitiveEntryPoint(Parser.EntryPoint.OrderBy)

	export const desugarUnconstrainedQualifiedEntityList = (
		{ entities, ...unsugarableEntityList }: SugaredUnconstrainedQualifiedEntityList,
		environment: Environment,
	): UnconstrainedQualifiedEntityList => {
		let hasOneRelationPath: HasOneRelation[]
		let entityName: EntityName

		if (typeof entities === 'string') {
			const desugared = desugarSugarableUnconstrainedQualifiedEntityList(entities, environment)
			entityName = desugared.entityName
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugared.hasOneRelationPath, environment)
		} else {
			entityName = entities.entityName
			hasOneRelationPath = desugarHasOneRelationPath(entities.hasOneRelationPath, {}, environment)
		}

		return {
			connections: unsugarableEntityList.connections
				? desugarConnections(unsugarableEntityList.connections, environment)
				: undefined,
			entityName,
			hasOneRelationPath,
		}
	}

	export const desugarUnconstrainedQualifiedSingleEntity = (
		{ entity, ...unsugarableSingleEntity }: SugaredUnconstrainedQualifiedSingleEntity,
		environment: Environment,
	): UnconstrainedQualifiedEntityList => {
		let hasOneRelationPath: HasOneRelation[]
		let entityName: EntityName

		if (typeof entity === 'string') {
			const desugared = desugarSugarableUnconstrainedQualifiedSingleEntity(entity, environment)
			entityName = desugared.entityName
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugared.hasOneRelationPath, environment)
		} else {
			entityName = entity.entityName
			hasOneRelationPath = desugarHasOneRelationPath(entity.hasOneRelationPath, {}, environment)
		}

		return {
			connections: unsugarableSingleEntity.connections
				? desugarConnections(unsugarableSingleEntity.connections, environment)
				: undefined,
			entityName,
			hasOneRelationPath,
		}
	}

	export const desugarQualifiedEntityList = (
		{ entities, ...unsugarableEntityList }: SugaredQualifiedEntityList,
		environment: Environment,
	): QualifiedEntityList => {
		let entityName: EntityName
		let hasOneRelationPath: HasOneRelation[]

		let filter: SugaredFilter | undefined

		if (typeof entities === 'string') {
			const desugared = desugarSugarableQualifiedEntityList(entities, environment)

			entityName = desugared.entityName
			filter = desugared.filter
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugared.hasOneRelationPath, environment)
		} else {
			entityName = entities.entityName
			filter = entities.filter
			hasOneRelationPath = desugarHasOneRelationPath(entities.hasOneRelationPath, {}, environment)
		}

		return {
			entityName,
			hasOneRelationPath,
			...desugarEntityListParameters(
				{
					filter,
				},
				unsugarableEntityList,
				environment,
			),
			connections: unsugarableEntityList.connections
				? desugarConnections(unsugarableEntityList.connections, environment)
				: undefined,
		}
	}

	export const desugarQualifiedFieldList = (
		{ fields, ...unsugarableFieldList }: SugaredQualifiedFieldList,
		environment: Environment,
	): QualifiedFieldList => {
		let field: FieldName
		let entityName: EntityName
		let filter: SugaredFilter | undefined
		let hasOneRelationPath: HasOneRelation[]

		if (typeof fields === 'string') {
			const desugared = desugarSugarableQualifiedFieldList(fields, environment)

			field = desugared.field
			entityName = desugared.entityName
			filter = desugared.filter
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugared.hasOneRelationPath, environment)
		} else {
			field = fields.field
			entityName = fields.entityName
			filter = fields.filter
			hasOneRelationPath = desugarHasOneRelationPath(fields.hasOneRelationPath, {}, environment)
		}

		return {
			field,
			entityName,
			hasOneRelationPath,
			connections: unsugarableFieldList.connections
				? desugarConnections(unsugarableFieldList.connections, environment)
				: undefined,
			defaultValue:
				unsugarableFieldList.defaultValue !== undefined
					? VariableInputTransformer.transformValue(unsugarableFieldList.defaultValue, environment)
					: undefined,
			isNonbearing: unsugarableFieldList.isNonbearing ?? false,
			...desugarEntityListParameters(
				{
					filter,
				},
				unsugarableFieldList,
				environment,
			),
		}
	}

	export const desugarQualifiedSingleEntity = (
		{ entity, ...unsugarableSingleEntity }: SugaredQualifiedSingleEntity,
		environment: Environment,
	): QualifiedSingleEntity => {
		let entityName: EntityName
		let where: UniqueWhere
		let filter: Filter | undefined
		let hasOneRelationPath: HasOneRelation[]

		if (typeof entity === 'string') {
			const desugaredEntity = desugarSugarableQualifiedSingleEntity(entity, environment)

			entityName = desugaredEntity.entityName
			where = desugaredEntity.where
			filter = desugaredEntity.filter
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugaredEntity.hasOneRelationPath, environment)
		} else {
			entityName = entity.entityName
			where = desugarUniqueWhere(entity.where, environment)
			filter = entity.filter ? desugarFilter(entity.filter, environment) : undefined
			hasOneRelationPath = desugarHasOneRelationPath(entity.hasOneRelationPath, {}, environment)
		}

		return {
			entityName,
			where,
			filter,
			hasOneRelationPath,
		}
	}

	export const desugarRelativeSingleEntity = (
		sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity,
		environment: Environment,
	): RelativeSingleEntity => {
		if (typeof sugaredRelativeSingleEntity === 'string') {
			return desugarRelativeSingleEntity(
				{
					field: sugaredRelativeSingleEntity,
				},
				environment,
			)
		}

		const { field, ...unsugarableEntity } = sugaredRelativeSingleEntity
		const hasOneRelationPath =
			typeof field === 'string'
				? augmentDesugaredHasOneRelationPath(
						desugarSugarableRelativeSingleEntity(field, environment).hasOneRelationPath,
						environment,
				  )
				: desugarHasOneRelationPath(field, unsugarableEntity, environment)

		return {
			hasOneRelationPath,
		}
	}

	export const desugarRelativeSingleField = (
		sugaredRelativeSingleField: string | SugaredRelativeSingleField,
		environment: Environment,
	): RelativeSingleField => {
		if (typeof sugaredRelativeSingleField === 'string') {
			return desugarRelativeSingleField(
				{
					field: sugaredRelativeSingleField,
				},
				environment,
			)
		}

		const { field, ...unsugarableField } = sugaredRelativeSingleField

		let hasOneRelationPath: HasOneRelation[]
		let fieldName: FieldName
		if (typeof field === 'string') {
			const desugaredField = desugarSugarableRelativeSingleField(field, environment)
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugaredField.hasOneRelationPath, environment)
			fieldName = desugaredField.field
		} else {
			hasOneRelationPath = desugarHasOneRelationPath(field.hasOneRelationPath, {}, environment)
			fieldName = field.field
		}

		return {
			hasOneRelationPath,
			field: fieldName,
			isNonbearing: unsugarableField.isNonbearing ?? false,
			defaultValue:
				unsugarableField.defaultValue !== undefined
					? VariableInputTransformer.transformValue(unsugarableField.defaultValue, environment)
					: undefined,
		}
	}

	export const desugarRelativeEntityList = (
		sugaredRelativeEntityList: string | SugaredRelativeEntityList,
		environment: Environment,
	): RelativeEntityList => {
		if (typeof sugaredRelativeEntityList === 'string') {
			return desugarRelativeEntityList(
				{
					field: sugaredRelativeEntityList,
				},
				environment,
			)
		}

		const { field, ...unsugarableEntityList } = sugaredRelativeEntityList
		let hasOneRelationPath: HasOneRelation[]
		let hasManyRelation: HasManyRelation
		if (typeof field === 'string') {
			const desugaredField = desugarSugarableRelativeEntityList(field, environment)
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugaredField.hasOneRelationPath, environment)
			hasManyRelation = augmentDesugaredHasManyRelation(
				desugaredField.hasManyRelation,
				unsugarableEntityList,
				environment,
			)
		} else {
			hasOneRelationPath = desugarHasOneRelationPath(field.hasOneRelationPath || [], {}, environment)
			hasManyRelation = desugarHasManyRelation(field.hasManyRelation, unsugarableEntityList, environment)
		}

		return {
			hasManyRelation,
			hasOneRelationPath,
		}
	}
}

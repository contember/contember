import * as Typesafe from '@contember/typesafe'

const LaxSchemaEnumInner = Typesafe.intersection(
	Typesafe.object({
		values: Typesafe.array(Typesafe.string),
		enumName: Typesafe.string,
	}),
	Typesafe.partial({
		notNull: Typesafe.boolean,
		unique: Typesafe.boolean,
	}),
)

const LaxSchemaColumnInner = Typesafe.partial({
	notNull: Typesafe.boolean,
	unique: Typesafe.boolean,
})

const LaxSchemaRelationInner = Typesafe.intersection(
	Typesafe.object({
		targetEntity: Typesafe.string,
		targetField: Typesafe.string,
	}),
	Typesafe.partial({
		notNull: Typesafe.boolean,
	}),
)

export const LaxSchemaField = Typesafe.discriminatedUnion('type', {
	oneHasOne: LaxSchemaRelationInner,
	oneHasOneInverse: LaxSchemaRelationInner,
	manyHasMany: LaxSchemaRelationInner,
	manyHasManyInverse: LaxSchemaRelationInner,
	oneHasMany: LaxSchemaRelationInner,
	manyHasOne: LaxSchemaRelationInner,
	int: LaxSchemaColumnInner,
	float: LaxSchemaColumnInner,
	boolean: LaxSchemaColumnInner,
	string: LaxSchemaColumnInner,
	json: LaxSchemaColumnInner,
	date: LaxSchemaColumnInner,
	datetime: LaxSchemaColumnInner,
	enum: LaxSchemaEnumInner,
})

export type LaxSchemaField = ReturnType<typeof LaxSchemaField>
export type LaxSchemaEnum = Extract<LaxSchemaField, { type: 'enum' }>
export type LaxSchemaColumn = Extract<LaxSchemaField, { type: 'int' | 'float' | 'boolean' | 'string' | 'json' | 'datetime' | 'date' | 'uuid' }>
export type LaxSchemaRelation = Extract<LaxSchemaField, {type: 'oneHasOne' | 'oneHasOneInverse' | 'manyHasMany' | 'manyHasManyInverse' | 'oneHasMany' | 'manyHasOne' }>

export const LaxSchemaEntity = Typesafe.object({
	fields: Typesafe.record(Typesafe.string, LaxSchemaField),
})
export type LaxSchemaEntity = ReturnType<typeof LaxSchemaEntity>

export const LaxSchema = Typesafe.object({
	entities: Typesafe.record(
		Typesafe.string,
		LaxSchemaEntity,
	),
})
export type LaxSchema = ReturnType<typeof LaxSchema>

import * as Typesafe from '@contember/typesafe'
import { Model } from '@contember/schema'
import { ParseError } from '@contember/typesafe'

const orderBySchema = Typesafe.array(Typesafe.object({
	path: Typesafe.array(Typesafe.string),
	direction: Typesafe.enumeration<Model.OrderDirection>(
		Model.OrderDirection.asc,
		Model.OrderDirection.desc,
		Model.OrderDirection.ascNullsFirst,
		Model.OrderDirection.descNullsLast,
	),
}))
const joiningColumnSchema = Typesafe.object({
	columnName: Typesafe.string,
	onDelete: Typesafe.enumeration<Model.OnDelete>(Model.OnDelete.cascade, Model.OnDelete.restrict, Model.OnDelete.setNull),
})
const oneHasManyRelationSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal(Model.RelationType.OneHasMany),
		name: Typesafe.string,
		target: Typesafe.string,
		ownedBy: Typesafe.string,
	}),
	Typesafe.partial({
		orderBy: orderBySchema,
	}),
)
const oneHasManyRelationSchemaCheck: Typesafe.Equals<Model.OneHasManyRelation, ReturnType<typeof oneHasManyRelationSchema>> = true

const manyHasOneRelationSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal(Model.RelationType.ManyHasOne),
		name: Typesafe.string,
		target: Typesafe.string,
		joiningColumn: joiningColumnSchema,
		nullable: Typesafe.boolean,
	}),
	Typesafe.partial({
		inversedBy: Typesafe.string,
	}),
)

const manyHasOneRelationSchemaCheck: Typesafe.Equals<Model.ManyHasOneRelation, ReturnType<typeof manyHasOneRelationSchema>> = true

const oneHasOneInverseRelationSchema = Typesafe.object({
	type: Typesafe.literal(Model.RelationType.OneHasOne),
	name: Typesafe.string,
	target: Typesafe.string,
	ownedBy: Typesafe.string,
	nullable: Typesafe.boolean,
})
const oneHasOneInverseRelationSchemaCheck: Typesafe.Equals<Model.OneHasOneInverseRelation, ReturnType<typeof oneHasOneInverseRelationSchema>> = true


const oneHasOneOwningRelationSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal(Model.RelationType.OneHasOne),
		name: Typesafe.string,
		target: Typesafe.string,
		joiningColumn: joiningColumnSchema,
		nullable: Typesafe.boolean,
	}),
	Typesafe.partial({
		inversedBy: Typesafe.string,
		orphanRemoval: Typesafe.literal(true),
	}),
)

const oneHasOneOwningRelationSchemaCheck: Typesafe.Equals<Model.OneHasOneOwningRelation, ReturnType<typeof oneHasOneOwningRelationSchema>> = true

const eventLogSchema = Typesafe.coalesce(Typesafe.object({
	enabled: Typesafe.boolean,
}), { enabled: true }) as Typesafe.Type<{ readonly enabled: boolean }>

const manyHasManyOwningRelationSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal(Model.RelationType.ManyHasMany),
		name: Typesafe.string,
		target: Typesafe.string,
		joiningTable: Typesafe.object({
			tableName: Typesafe.string,
			joiningColumn: joiningColumnSchema,
			inverseJoiningColumn: joiningColumnSchema,
			eventLog: eventLogSchema,
		}),
	}),
	Typesafe.partial({
		inversedBy: Typesafe.string,
		orderBy: orderBySchema,
	}),
)
const manyHasManyOwningRelationSchemaCheck: Typesafe.Equals<Model.ManyHasManyOwningRelation, ReturnType<typeof manyHasManyOwningRelationSchema>> = true

const manyHasManyInverseRelationSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal(Model.RelationType.ManyHasMany),
		name: Typesafe.string,
		target: Typesafe.string,
		ownedBy: Typesafe.string,
	}),
	Typesafe.partial({
		orderBy: orderBySchema,
	}),
)
const manyHasManyInverseRelationSchemaCheck: Typesafe.Equals<Model.ManyHasManyInverseRelation, ReturnType<typeof manyHasManyInverseRelationSchema>> = true

const intersectionSchema = Typesafe.intersection(
	Typesafe.object({
		precedence: Typesafe.enumeration('ALWAYS', 'BY DEFAULT'),
	}),
	Typesafe.partial({
		start: Typesafe.number,
	}),
)
const intersectionSchemaCheck: Typesafe.Equals<Model.AnyColumn['sequence'], ReturnType<typeof intersectionSchema>> = true

const columnSchema = Typesafe.intersection(
	Typesafe.object({
		name: Typesafe.string,
		columnName: Typesafe.string,
		columnType: Typesafe.transform(Typesafe.string, (it, raw, path) => {
			if (!it.replaceAll(/\s+/g, '').match(/^[\w_]+(?:\(\w+(?:,\w+)*\))?\w*(?:"[^"]+")?(\[])*$/)) {
				throw ParseError.format(it, path, 'valid column type')
			}
			return it
		}),
		nullable: Typesafe.boolean,
		type: Typesafe.enumeration<Model.ColumnType>(...Object.values(Model.ColumnType)),
	}),
	Typesafe.partial({
		typeAlias: Typesafe.string,
		list: Typesafe.boolean,
		default: Typesafe.anyJson,
		sequence: intersectionSchema as Typesafe.Type<Model.AnyColumn['sequence']>,
	}),
)
const columnSchemaCheck: Typesafe.Equals<Model.AnyColumn, ReturnType<typeof columnSchema>> = true

const fieldSchema: Typesafe.Type<Model.AnyField> = Typesafe.partiallyDiscriminatedUnion(
	'type',
	oneHasOneInverseRelationSchema,
	oneHasOneOwningRelationSchema,
	oneHasManyRelationSchema,
	manyHasOneRelationSchema,
	manyHasManyInverseRelationSchema,
	manyHasManyOwningRelationSchema,
	columnSchema,
)

const viewSchemaInner = Typesafe.intersection(
	Typesafe.object({
		sql: Typesafe.string,
	}),
	Typesafe.partial({
		dependencies: Typesafe.array(Typesafe.string),
	}),
)
const viewSchemaCheck: Typesafe.Equals<Model.View, ReturnType<typeof viewSchemaInner>> = true
const viewSchema: Typesafe.Type<Model.View> = viewSchemaInner


const indexLike: Typesafe.Type<{readonly fields: readonly string[]; readonly name?: string | undefined}> = Typesafe.intersection(
	Typesafe.object({
		fields: Typesafe.array(Typesafe.string),
	}),
	Typesafe.partial({
		name: Typesafe.string,
	}),
)

const indexesSchema = Typesafe.coalesce<Model.Indexes, Model.Indexes>(
	Typesafe.preprocess(
		Typesafe.array(indexLike),
		it => it?.constructor === Object ? Object.values(it) : it,
	),
	[],
)

const uniqueConstraint = Typesafe.intersection(
	indexLike,
	Typesafe.partial({
		timing: Typesafe.enumeration('deferrable', 'deferred'),
	}),
)
const uniqueConstraintCheck: Typesafe.Equals<Model.UniqueConstraint, ReturnType<typeof uniqueConstraint>> = true

const entitySchema = Typesafe.intersection(
	Typesafe.object({
		name: Typesafe.string,
		primary: Typesafe.string,
		primaryColumn: Typesafe.string,
		tableName: Typesafe.string,
		fields: Typesafe.record(Typesafe.string, fieldSchema),
		unique: Typesafe.preprocess<Model.UniqueConstraints>(
			Typesafe.array(uniqueConstraint),
			it => it?.constructor === Object ? Object.values(it) : it,
		),
		indexes: indexesSchema,
		eventLog: eventLogSchema,
	}),
	Typesafe.partial({
		view: viewSchema,
		orderBy: orderBySchema,
	}),
)

const entitySchemaCheck: Typesafe.Equals<Model.Entity, ReturnType<typeof entitySchema>> = true

export const modelSchema = Typesafe.object({
	entities: Typesafe.record(Typesafe.string, entitySchema),
	enums: Typesafe.record(Typesafe.string, Typesafe.array(Typesafe.string)),
})


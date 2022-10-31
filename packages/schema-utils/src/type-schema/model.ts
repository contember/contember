import * as Typesafe from '@contember/typesafe'
import { Model } from '@contember/schema'

const orderBySchema = Typesafe.array(Typesafe.object({
	path: Typesafe.array(Typesafe.string),
	direction: Typesafe.enumeration<Model.OrderDirection>(Model.OrderDirection.asc, Model.OrderDirection.desc),
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
		columnType: Typesafe.string,
		nullable: Typesafe.boolean,
		type: Typesafe.enumeration<Model.ColumnType>(...Object.values(Model.ColumnType)),
	}),
	Typesafe.partial({
		typeAlias: Typesafe.string,
		default: Typesafe.union(Typesafe.string, Typesafe.number, Typesafe.boolean, Typesafe.null_),
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


const indexesSchema = Typesafe.coalesce<Model.Indexes, Model.Indexes>(Typesafe.record(Typesafe.string, Typesafe.object({
	fields: Typesafe.array(Typesafe.string),
	name: Typesafe.string,
})), { })

const entitySchema = Typesafe.intersection(
	Typesafe.object({
		name: Typesafe.string,
		primary: Typesafe.string,
		primaryColumn: Typesafe.string,
		tableName: Typesafe.string,
		fields: Typesafe.record(Typesafe.string, fieldSchema),
		unique: Typesafe.record(Typesafe.string, Typesafe.object({
			fields: Typesafe.array(Typesafe.string),
			name: Typesafe.string,
		})),
		indexes: indexesSchema,
		eventLog: eventLogSchema,
	}),
	Typesafe.partial({
		view: viewSchema,
	}),
)

const entitySchemaCheck: Typesafe.Equals<Model.Entity, ReturnType<typeof entitySchema>> = true

export const modelSchema = Typesafe.object({
	entities: Typesafe.record(Typesafe.string, entitySchema),
	enums: Typesafe.record(Typesafe.string, Typesafe.array(Typesafe.string)),
})


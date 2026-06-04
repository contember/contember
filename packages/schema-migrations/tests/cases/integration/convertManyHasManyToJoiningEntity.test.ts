import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests.js'
import { SQL } from '../../src/tags.js'
import { Model } from '@contember/schema'

const uuidColumn = (name: string): Model.AnyColumn => ({
	name,
	columnName: name,
	type: Model.ColumnType.Uuid,
	columnType: 'uuid',
	nullable: false,
})

const stringColumn = (name: string): Model.AnyColumn => ({
	name,
	columnName: name,
	type: Model.ColumnType.String,
	columnType: 'text',
	nullable: true,
})

// Shared expected SQL for both the bidirectional and unidirectional cases (the SQL is identical:
// it depends only on the junction table/columns, not on the inverse relations).
const convertSql = SQL`
	DROP TRIGGER "log_event" ON "post_categories";
	DROP TRIGGER "log_event_trx" ON "post_categories";
	ALTER TABLE "post_categories" ADD COLUMN "id" uuid;
	DO $ensure_uuid$
	BEGIN
		IF NOT EXISTS(
			SELECT FROM pg_proc
			JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
			WHERE pg_namespace.nspname = 'system' AND pg_proc.proname = 'uuid_generate_v4'
		) THEN
			CREATE FUNCTION "system"."uuid_generate_v4"() RETURNS "uuid"
			LANGUAGE "sql"
			AS $ensure_uuid_body$
				SELECT OVERLAY(OVERLAY(md5(random()::TEXT || ':' || clock_timestamp()::TEXT) PLACING '4' FROM 13) PLACING
					to_hex(floor(random() * (11 - 8 + 1) + 8)::INT)::TEXT FROM 17)::UUID;
			$ensure_uuid_body$;
		END IF;
	END
	$ensure_uuid$;
	UPDATE "post_categories" SET "id" = "system"."uuid_generate_v4"();
	ALTER TABLE "post_categories" ALTER COLUMN "id" SET NOT NULL;
	ALTER TABLE "post_categories" DROP CONSTRAINT "post_categories_pkey";
	ALTER TABLE "post_categories" ADD PRIMARY KEY ("id");
	ALTER TABLE "post_categories" ADD UNIQUE ("post_id", "category_id");
	CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE
		ON "post_categories" FOR EACH ROW
		EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
	CREATE CONSTRAINT TRIGGER "log_event_trx" AFTER INSERT OR UPDATE OR DELETE
		ON "post_categories" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
		EXECUTE PROCEDURE "system"."trigger_event_commit"();
`

namespace ConvertMHMToEntityOriginal {
	export const model: Model.Schema = {
		enums: {},
		entities: {
			Post: {
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
					categories: {
						name: 'categories',
						type: Model.RelationType.ManyHasMany,
						target: 'Category',
						inversedBy: 'posts',
						joiningTable: {
							tableName: 'post_categories',
							joiningColumn: { columnName: 'post_id', onDelete: Model.OnDelete.cascade },
							inverseJoiningColumn: { columnName: 'category_id', onDelete: Model.OnDelete.cascade },
							eventLog: { enabled: true },
						},
					} as Model.ManyHasManyOwningRelation,
				},
			},
			Category: {
				name: 'Category',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'category',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
					posts: {
						name: 'posts',
						type: Model.RelationType.ManyHasMany,
						target: 'Post',
						ownedBy: 'categories',
					} as Model.ManyHasManyInverseRelation,
				},
			},
		},
	}
}

namespace ConvertMHMToEntityUpdated {
	export const model: Model.Schema = {
		enums: {},
		entities: {
			Post: {
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
					postCategories: {
						name: 'postCategories',
						type: Model.RelationType.OneHasMany,
						target: 'PostCategory',
						ownedBy: 'post',
					} as Model.OneHasManyRelation,
				},
			},
			Category: {
				name: 'Category',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'category',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
					postCategories: {
						name: 'postCategories',
						type: Model.RelationType.OneHasMany,
						target: 'PostCategory',
						ownedBy: 'category',
					} as Model.OneHasManyRelation,
				},
			},
			PostCategory: {
				name: 'PostCategory',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post_categories',
				eventLog: { enabled: true },
				unique: [{ fields: ['post', 'category'] }],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					post: {
						name: 'post',
						type: Model.RelationType.ManyHasOne,
						target: 'Post',
						inversedBy: 'postCategories',
						nullable: false,
						joiningColumn: { columnName: 'post_id', onDelete: Model.OnDelete.cascade },
					} as Model.ManyHasOneRelation,
					category: {
						name: 'category',
						type: Model.RelationType.ManyHasOne,
						target: 'Category',
						inversedBy: 'postCategories',
						nullable: false,
						joiningColumn: { columnName: 'category_id', onDelete: Model.OnDelete.cascade },
					} as Model.ManyHasOneRelation,
				},
			},
		},
	}
}

describe('convert many has many to joining entity', () => {
	testMigrations({
		original: { model: ConvertMHMToEntityOriginal.model },
		updated: { model: ConvertMHMToEntityUpdated.model },
		// This conversion is not auto-detected by the differ (the naive diff would drop the
		// junction table and lose data), so the modification is applied explicitly.
		noDiff: true,
		diff: [
			{
				modification: 'convertManyHasManyToJoiningEntity',
				entityName: 'Post',
				fieldName: 'categories',
				// The join-uniqueness constraint is added by the modification itself, so the input
				// joining entity carries no unique constraints.
				joiningEntity: { ...ConvertMHMToEntityUpdated.model.entities.PostCategory, unique: [] },
				sourceInverseSide: ConvertMHMToEntityUpdated.model.entities.Post.fields.postCategories,
				targetInverseSide: ConvertMHMToEntityUpdated.model.entities.Category.fields.postCategories,
			},
		],
		// Both event-log triggers are dropped up-front: keeping the deferred `log_event_trx` would
		// queue pending trigger events on the back-fill UPDATE and break the following ALTER TABLE.
		// They are re-created at the end (`log_event` re-pointed onto the new surrogate id).
		sql: convertSql,
	})
})

namespace ConvertUnidirectionalMHMOriginal {
	export const model: Model.Schema = {
		enums: {},
		entities: {
			Post: {
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
					// unidirectional: no `inversedBy`, Category has no matching inverse relation
					categories: {
						name: 'categories',
						type: Model.RelationType.ManyHasMany,
						target: 'Category',
						joiningTable: {
							tableName: 'post_categories',
							joiningColumn: { columnName: 'post_id', onDelete: Model.OnDelete.cascade },
							inverseJoiningColumn: { columnName: 'category_id', onDelete: Model.OnDelete.cascade },
							eventLog: { enabled: true },
						},
					} as Model.ManyHasManyOwningRelation,
				},
			},
			Category: {
				name: 'Category',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'category',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
				},
			},
		},
	}
}

namespace ConvertUnidirectionalMHMUpdated {
	export const model: Model.Schema = {
		enums: {},
		entities: {
			Post: {
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
					postCategories: {
						name: 'postCategories',
						type: Model.RelationType.OneHasMany,
						target: 'PostCategory',
						ownedBy: 'post',
					} as Model.OneHasManyRelation,
				},
			},
			Category: {
				name: 'Category',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'category',
				eventLog: { enabled: true },
				unique: [],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					title: stringColumn('title'),
				},
			},
			PostCategory: {
				name: 'PostCategory',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post_categories',
				eventLog: { enabled: true },
				unique: [{ fields: ['post', 'category'] }],
				indexes: [],
				fields: {
					id: uuidColumn('id'),
					post: {
						name: 'post',
						type: Model.RelationType.ManyHasOne,
						target: 'Post',
						inversedBy: 'postCategories',
						nullable: false,
						joiningColumn: { columnName: 'post_id', onDelete: Model.OnDelete.cascade },
					} as Model.ManyHasOneRelation,
					category: {
						name: 'category',
						type: Model.RelationType.ManyHasOne,
						target: 'Category',
						nullable: false,
						joiningColumn: { columnName: 'category_id', onDelete: Model.OnDelete.cascade },
					} as Model.ManyHasOneRelation,
				},
			},
		},
	}
}

describe('convert unidirectional many has many to joining entity', () => {
	testMigrations({
		original: { model: ConvertUnidirectionalMHMOriginal.model },
		updated: { model: ConvertUnidirectionalMHMUpdated.model },
		noDiff: true,
		diff: [
			{
				modification: 'convertManyHasManyToJoiningEntity',
				entityName: 'Post',
				fieldName: 'categories',
				joiningEntity: { ...ConvertUnidirectionalMHMUpdated.model.entities.PostCategory, unique: [] },
				// only the owning side gets a one-has-many; the target stays untouched (unidirectional)
				sourceInverseSide: ConvertUnidirectionalMHMUpdated.model.entities.Post.fields.postCategories,
			},
		],
		sql: convertSql,
	})
})

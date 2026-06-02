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
		// Note: `log_event_trx` is NOT dropped or re-created — it takes no column params and stays
		// valid across the primary-key change. Re-creating it would fail with "trigger already exists".
		sql: SQL`
		DROP TRIGGER "log_event" ON "post_categories";
		ALTER TABLE "post_categories" ADD COLUMN "id" uuid;
		UPDATE "post_categories" SET "id" = "system"."uuid_generate_v4"();
		ALTER TABLE "post_categories" ALTER COLUMN "id" SET NOT NULL;
		ALTER TABLE "post_categories" DROP CONSTRAINT "post_categories_pkey";
		ALTER TABLE "post_categories" ADD PRIMARY KEY ("id");
		ALTER TABLE "post_categories" ADD UNIQUE ("post_id", "category_id");
		CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE
			ON "post_categories" FOR EACH ROW
			EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
		`,
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
		sql: SQL`
		DROP TRIGGER "log_event" ON "post_categories";
		ALTER TABLE "post_categories" ADD COLUMN "id" uuid;
		UPDATE "post_categories" SET "id" = "system"."uuid_generate_v4"();
		ALTER TABLE "post_categories" ALTER COLUMN "id" SET NOT NULL;
		ALTER TABLE "post_categories" DROP CONSTRAINT "post_categories_pkey";
		ALTER TABLE "post_categories" ADD PRIMARY KEY ("id");
		ALTER TABLE "post_categories" ADD UNIQUE ("post_id", "category_id");
		CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE
			ON "post_categories" FOR EACH ROW
			EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
		`,
	})
})

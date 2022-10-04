import { test } from 'vitest'
import { testGenerateSql } from '../../src/tests'
import {
	createEntityModification,
	createRelationModification,
	removeFieldModification,
	updateEntityNameModification,
} from '../../../src'
import { emptyModelSchema } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

test('taken fk index name', () => {
	testGenerateSql(emptyModelSchema, [
		createEntityModification.createModification({
			entity: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				unique: {},
				eventLog: {
					enabled: true,
				},
				indexes: {},
			},
		}),
		createEntityModification.createModification({
			entity: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'Author',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'author',
				unique: {},
				eventLog: {
					enabled: true,
				},
				indexes: {},
			},
		}),
		createRelationModification.createModification({
			entityName: 'Post',
			owningSide: {
				name: 'author',
				type: Model.RelationType.ManyHasOne,
				target: 'Author',
				joiningColumn: {
					columnName: 'author_id',
					onDelete: Model.OnDelete.cascade,
				},
				nullable: true,
			},

		}),
		updateEntityNameModification.createModification({
			entityName: 'Post',
			newEntityName: 'Article',
			tableName: 'article',
		}),
		createEntityModification.createModification({
			entity: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				unique: {},
				eventLog: {
					enabled: true,
				},
				indexes: {},
			},
		}),
		createRelationModification.createModification({
			entityName: 'Post',
			owningSide: {
				name: 'author',
				type: Model.RelationType.ManyHasOne,
				target: 'Author',
				joiningColumn: {
					columnName: 'author_id',
					onDelete: Model.OnDelete.cascade,
				},
				nullable: true,
			},

		}),
	], SQL`CREATE TABLE "post" (
  "id" uuid PRIMARY KEY NOT NULL
);
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "post"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
CREATE CONSTRAINT TRIGGER "log_event_trx"
  AFTER INSERT OR UPDATE OR DELETE ON "post"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event_commit"();
CREATE TABLE "author" (
  "id" uuid PRIMARY KEY NOT NULL
);
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "author"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
CREATE CONSTRAINT TRIGGER "log_event_trx"
  AFTER INSERT OR UPDATE OR DELETE ON "author"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event_commit"();
ALTER TABLE "post"
  ADD "author_id" uuid;
ALTER TABLE "post"
  ADD CONSTRAINT "fk_post_author_id_87ef9a" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "post_author_id_index" ON "post" ("author_id");
ALTER TABLE "post" RENAME TO "article";
CREATE TABLE "post" (
  "id" uuid PRIMARY KEY NOT NULL
);
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "post"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
CREATE CONSTRAINT TRIGGER "log_event_trx"
  AFTER INSERT OR UPDATE OR DELETE ON "post"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event_commit"();
ALTER TABLE "post"
  ADD "author_id" uuid;
ALTER TABLE "post"
  ADD CONSTRAINT "fk_post_author_id_87ef9a" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "post_author_id_index1" ON "post" ("author_id");`)
})


test('taken junction table index name', () => {
	testGenerateSql(emptyModelSchema, [
		createEntityModification.createModification({
			entity: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'Post',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'post',
				unique: {},
				eventLog: {
					enabled: true,
				},
				indexes: {},
			},
		}),
		createEntityModification.createModification({
			entity: {
				fields: {
					id: {
						columnName: 'id',
						name: 'id',
						nullable: false,
						type: Model.ColumnType.Uuid,
						columnType: 'uuid',
					},
				},
				name: 'Author',
				primary: 'id',
				primaryColumn: 'id',
				tableName: 'author',
				unique: {},
				eventLog: {
					enabled: true,
				},
				indexes: {},
			},
		}),
		createRelationModification.createModification({
			entityName: 'Post',
			owningSide: {
				name: 'authors',
				type: Model.RelationType.ManyHasMany,
				target: 'Author',
				joiningTable: {
					tableName: 'post_authors',
					joiningColumn: {
						columnName: 'post_id',
						onDelete: Model.OnDelete.cascade,
					},
					inverseJoiningColumn: {
						columnName: 'author_id',
						onDelete: Model.OnDelete.cascade,
					},
					eventLog: {
						enabled: true,
					},
				},
			},
		}),
		removeFieldModification.createModification({
			entityName: 'Post',
			fieldName: 'authors',
		}),
		createRelationModification.createModification({
			entityName: 'Post',
			owningSide: {
				name: 'authors',
				type: Model.RelationType.ManyHasMany,
				target: 'Author',
				joiningTable: {
					tableName: 'post_authors',
					joiningColumn: {
						columnName: 'post_id',
						onDelete: Model.OnDelete.cascade,
					},
					inverseJoiningColumn: {
						columnName: 'author_id',
						onDelete: Model.OnDelete.cascade,
					},
					eventLog: {
						enabled: true,
					},
				},
			},
		}),
	], SQL`CREATE TABLE "post" (
  "id" uuid PRIMARY KEY NOT NULL
);
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "post"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
CREATE CONSTRAINT TRIGGER "log_event_trx"
  AFTER INSERT OR UPDATE OR DELETE ON "post"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event_commit"();
CREATE TABLE "author" (
  "id" uuid PRIMARY KEY NOT NULL
);
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "author"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pga$id$pga$);
CREATE CONSTRAINT TRIGGER "log_event_trx"
  AFTER INSERT OR UPDATE OR DELETE ON "author"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event_commit"();
CREATE TABLE "post_authors" (
  "post_id" uuid NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "author"("id") ON DELETE CASCADE
);
ALTER TABLE "post_authors"
  ADD CONSTRAINT "post_authors_pkey" PRIMARY KEY ("post_id", "author_id");
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "post_authors"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pga$post_id$pga$, $pga$author_id$pga$);
CREATE CONSTRAINT TRIGGER "log_event_trx"
  AFTER INSERT OR UPDATE OR DELETE ON "post_authors"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event_commit"();
DROP TABLE "post_authors";
CREATE TABLE "post_authors" (
  "post_id" uuid NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "author"("id") ON DELETE CASCADE
);
ALTER TABLE "post_authors"
  ADD CONSTRAINT "post_authors_pkey1" PRIMARY KEY ("post_id", "author_id");
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "post_authors"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pga$post_id$pga$, $pga$author_id$pga$);
CREATE CONSTRAINT TRIGGER "log_event_trx"
  AFTER INSERT OR UPDATE OR DELETE ON "post_authors"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event_commit"();
`)
})

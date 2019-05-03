import { Acl, Model } from 'cms-common'
import { expect } from 'chai'
import { SQL } from '../../../src/tags'
import 'mocha'
import Migration from '../../../../src/system-api/model/migrations/Migration'
import SchemaDiffer from '../../../../src/system-api/model/migrations/SchemaDiffer'
import SchemaMigrator from '../../../../src/content-schema/differ/SchemaMigrator'
import { createMigrationBuilder } from '../../../../src/content-api/sqlSchema/sqlSchemaBuilderHelper'
import SchemaBuilder from '../../../../src/content-schema/builder/SchemaBuilder'
import ModificationHandlerFactory from '../../../../src/system-api/model/migrations/modifications/ModificationHandlerFactory'

const emptyAcl = { roles: {}, variables: {} }

const modificationFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
const schemaMigrator = new SchemaMigrator(modificationFactory)
const schemaDiffer = new SchemaDiffer(schemaMigrator)

function testDiffSchemas(
	originalSchema: Model.Schema,
	updatedSchema: Model.Schema,
	expectedDiff: Migration.Modification[]
) {
	const actual = schemaDiffer.diffSchemas(
		{ model: originalSchema, acl: emptyAcl },
		{ model: updatedSchema, acl: emptyAcl }
	)
	expect(actual).deep.equals(expectedDiff)
}

function testApplyDiff(originalSchema: Model.Schema, diff: Migration.Modification[], expectedSchema: Model.Schema) {
	const actual = schemaMigrator.applyDiff({ model: originalSchema, acl: emptyAcl }, diff)
	expect(actual.model).deep.equals(expectedSchema)
}

function testGenerateSql(originalSchema: Model.Schema, diff: Migration.Modification[], expectedSql: string) {
	let schema = { model: originalSchema, acl: emptyAcl }
	const builder = createMigrationBuilder()
	for (let { modification, ...data } of diff) {
		const modificationHandler = modificationFactory.create(modification, data, schema)
		modificationHandler.createSql(builder)
		schema = modificationHandler.getSchemaUpdater()(schema)
	}
	const actual = builder
		.getSql()
		.replace(/\s+/g, ' ')
		.trim()
	expect(actual).equals(expectedSql)
}

describe('Diff schemas', () => {
	describe('author table (no relations, unique on column)', () => {
		const originalSchema = new SchemaBuilder().buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.column('email', c => c.type(Model.ColumnType.String).unique())
					.column('registeredAt', c => c.type(Model.ColumnType.Date))
			)
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'createEntity',
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
				},
			},
			{
				modification: 'createColumn',
				entityName: 'Author',
				field: {
					columnName: 'name',
					name: 'name',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
			{
				modification: 'createColumn',
				entityName: 'Author',
				field: {
					columnName: 'email',
					name: 'email',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
			{
				modification: 'createColumn',
				entityName: 'Author',
				field: {
					columnName: 'registered_at',
					name: 'registeredAt',
					nullable: true,
					type: Model.ColumnType.Date,
					columnType: 'date',
				},
			},
			{
				modification: 'createUniqueConstraint',
				entityName: 'Author',
				unique: {
					name: 'unique_Author_email_a3e587',
					fields: ['email'],
				},
			},
		]
		const sql = SQL`CREATE TABLE "author" ( "id" uuid PRIMARY KEY NOT NULL );
			  CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE ON "author" FOR EACH ROW EXECUTE PROCEDURE "system"."trigger_event"();
			  ALTER TABLE "author" ADD "name" text;
			  ALTER TABLE "author" ADD "email" text;
			  ALTER TABLE "author" ADD "registered_at" date;
			  ALTER TABLE "author" ADD CONSTRAINT "unique_Author_email_a3e587" UNIQUE ("email");`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('post with author (many has one)', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.manyHasOne('author', r => r.target('Author').onDelete(Model.OnDelete.cascade))
			)
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'createEntity',
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
				},
			},
			{
				modification: 'createColumn',
				entityName: 'Post',
				field: {
					columnName: 'title',
					name: 'title',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
			{
				modification: 'createRelation',
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
			},
		]
		const sql = SQL`CREATE TABLE "post" ( "id" uuid PRIMARY KEY NOT NULL );
			CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE ON "post" FOR EACH ROW EXECUTE PROCEDURE "system"."trigger_event"();
			ALTER TABLE "post" ADD "title" text;
			ALTER TABLE "post" ADD "author_id" uuid;
			ALTER TABLE "post" ADD CONSTRAINT "fk_post_author_id_87ef9a" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
			CREATE INDEX "post_author_id_index" ON "post" ("author_id");`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('post with locales (one has many)', () => {
		const originalSchema = new SchemaBuilder().entity('Post', e => e).buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e =>
				e.oneHasMany('locales', r =>
					r
						.target('PostLocale')
						.ownerNotNull()
						.ownedBy('post')
				)
			)
			.entity('PostLocale', e =>
				e
					.unique(['post', 'locale'])
					.column('title', c => c.type(Model.ColumnType.String))
					.column('locale', c => c.type(Model.ColumnType.String))
			)
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'createEntity',
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
					name: 'PostLocale',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'post_locale',
					unique: {},
				},
			},
			{
				modification: 'createRelation',
				entityName: 'PostLocale',
				owningSide: {
					name: 'post',
					type: Model.RelationType.ManyHasOne,
					target: 'Post',
					inversedBy: 'locales',
					joiningColumn: {
						columnName: 'post_id',
						onDelete: Model.OnDelete.restrict,
					},
					nullable: false,
				},
				inverseSide: {
					name: 'locales',
					type: Model.RelationType.OneHasMany,
					target: 'PostLocale',
					ownedBy: 'post',
				},
			},
			{
				modification: 'createColumn',
				entityName: 'PostLocale',
				field: {
					columnName: 'title',
					name: 'title',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
			{
				modification: 'createColumn',
				entityName: 'PostLocale',
				field: {
					columnName: 'locale',
					name: 'locale',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
			{
				modification: 'createUniqueConstraint',
				entityName: 'PostLocale',
				unique: {
					name: 'unique_PostLocale_post_locale_5759e8',
					fields: ['post', 'locale'],
				},
			},
		]
		const sql = SQL`CREATE TABLE "post_locale" ( "id" uuid PRIMARY KEY NOT NULL );
			CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE ON "post_locale" FOR EACH ROW EXECUTE PROCEDURE "system"."trigger_event"();
			ALTER TABLE "post_locale" ADD "post_id" uuid NOT NULL;
    	ALTER TABLE "post_locale" ADD CONSTRAINT "fk_post_locale_post_id_f3d2e5" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
			CREATE INDEX "post_locale_post_id_index" ON "post_locale" ("post_id");
			ALTER TABLE "post_locale" ADD "title" text;
			ALTER TABLE "post_locale" ADD "locale" text;
			ALTER TABLE "post_locale" ADD CONSTRAINT "unique_PostLocale_post_locale_5759e8" UNIQUE ("post_id", "locale");`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('post with locales (add 1:m to m:1)', () => {
		const originalSchema: Model.Schema = {
			entities: {
				Post: {
					name: 'Post',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'post',
					fields: {},
					unique: {},
				},
				PostLocale: {
					name: 'PostLocale',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'post_locale',
					fields: {
						post: {
							name: 'post',
							type: Model.RelationType.ManyHasOne,
							target: 'Post',
							joiningColumn: {
								columnName: 'post_id',
								onDelete: Model.OnDelete.restrict,
							},
							nullable: true,
						},
					},
					unique: {},
				},
			},
			enums: {},
		}
		const updatedSchema: Model.Schema = {
			entities: {
				Post: {
					name: 'Post',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'post',
					fields: {
						locales: {
							name: 'locales',
							type: Model.RelationType.OneHasMany,
							target: 'PostLocale',
							ownedBy: 'post',
						},
					},
					unique: {},
				},
				PostLocale: {
					name: 'PostLocale',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'post_locale',
					fields: {
						post: {
							inversedBy: 'locales',
							name: 'post',
							type: Model.RelationType.ManyHasOne,
							target: 'Post',
							joiningColumn: {
								columnName: 'post_id',
								onDelete: Model.OnDelete.restrict,
							},
							nullable: true,
						},
					},
					unique: {},
				},
			},
			enums: {},
		}

		const diff: Migration.Modification[] = [
			{
				modification: 'createRelationInverseSide',
				entityName: 'Post',
				relation: {
					name: 'locales',
					type: Model.RelationType.OneHasMany,
					target: 'PostLocale',
					ownedBy: 'post',
				},
			},
		]
		const sql = SQL``
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('post with categories (many has many)', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e =>
				e.column('title', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category'))
			)
			.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'createEntity',
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
					name: 'Category',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'category',
					unique: {},
				},
			},
			{
				modification: 'createRelation',
				entityName: 'Post',
				owningSide: {
					name: 'categories',
					type: Model.RelationType.ManyHasMany,
					target: 'Category',
					joiningTable: {
						tableName: 'post_categories',
						joiningColumn: {
							columnName: 'post_id',
							onDelete: Model.OnDelete.cascade,
						},
						inverseJoiningColumn: {
							columnName: 'category_id',
							onDelete: Model.OnDelete.cascade,
						},
					},
				},
			},
			{
				modification: 'createColumn',
				entityName: 'Category',
				field: {
					columnName: 'title',
					name: 'title',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
		]
		const sql = SQL`CREATE TABLE "category" ( "id" uuid PRIMARY KEY NOT NULL );
			  CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE ON "category" FOR EACH ROW EXECUTE PROCEDURE "system"."trigger_event"();
			  CREATE TABLE "post_categories" (
				"id"          uuid PRIMARY KEY NOT NULL,
				"post_id"     uuid NOT NULL REFERENCES "post"("id") ON DELETE CASCADE,
				"category_id" uuid NOT NULL REFERENCES "category"("id") ON DELETE CASCADE,
				CONSTRAINT "post_categories_uniq_post_id_category_id" UNIQUE ("post_id", "category_id")
			  );
			  CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE ON "post_categories" FOR EACH ROW EXECUTE PROCEDURE "system"."trigger_event"();
			  ALTER TABLE "category" ADD "title" text;`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('site and setting (one has one)', () => {
		const originalSchema = new SchemaBuilder().buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'createEntity',
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
					name: 'Site',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'site',
					unique: {},
				},
			},
			{
				modification: 'createEntity',
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
					name: 'SiteSetting',
					primary: 'id',
					primaryColumn: 'id',
					tableName: 'site_setting',
					unique: {},
				},
			},
			{
				modification: 'createColumn',
				entityName: 'Site',
				field: {
					columnName: 'name',
					name: 'name',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
			{
				modification: 'createRelation',
				entityName: 'Site',
				owningSide: {
					name: 'setting',
					type: Model.RelationType.OneHasOne,
					target: 'SiteSetting',
					inversedBy: 'site',
					joiningColumn: {
						columnName: 'setting_id',
						onDelete: Model.OnDelete.restrict,
					},
					nullable: true,
				},
				inverseSide: {
					name: 'site',
					type: Model.RelationType.OneHasOne,
					target: 'Site',
					ownedBy: 'setting',
					nullable: true,
				},
			},
			{
				modification: 'createColumn',
				entityName: 'SiteSetting',
				field: {
					columnName: 'url',
					name: 'url',
					nullable: true,
					type: Model.ColumnType.String,
					columnType: 'text',
				},
			},
			{
				entityName: 'Site',
				modification: 'createUniqueConstraint',
				unique: {
					fields: ['setting'],
					name: 'unique_Site_setting_8653a0',
				},
			},
		]
		const sql = SQL`CREATE TABLE "site" ( "id" uuid PRIMARY KEY NOT NULL );
			CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE ON "site" FOR EACH ROW EXECUTE PROCEDURE "system"."trigger_event"();
			CREATE TABLE "site_setting" ( "id" uuid PRIMARY KEY NOT NULL );
			CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE ON "site_setting" FOR EACH ROW EXECUTE PROCEDURE "system"."trigger_event"();
			ALTER TABLE "site" ADD "name" text;
			ALTER TABLE "site" ADD "setting_id" uuid UNIQUE;
			ALTER TABLE "site" ADD CONSTRAINT "fk_site_setting_id_6a4aa6" FOREIGN KEY ("setting_id") REFERENCES "site_setting"("id") ON DELETE NO ACTION DEFERRABLE INITIALLY IMMEDIATE;
			ALTER TABLE "site_setting" ADD "url" text;`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('remove table', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.manyHasOne('author', r => r.target('Author').onDelete(Model.OnDelete.cascade))
			)
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'removeField',
				entityName: 'Post',
				fieldName: 'author',
			},
			{
				modification: 'removeEntity',
				entityName: 'Author',
			},
		]
		const sql = SQL`ALTER TABLE "post" DROP "author_id";
			DROP TABLE "author";`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('add enum', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' }))
			)
			.enum('postStatus', ['publish', 'draft', 'auto-draft'])
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'createEnum',
				enumName: 'postStatus',
				values: ['publish', 'draft', 'auto-draft'],
			},
			{
				modification: 'createColumn',
				entityName: 'Post',
				field: {
					columnName: 'status',
					name: 'status',
					nullable: true,
					type: Model.ColumnType.Enum,
					columnType: 'postStatus',
					enumName: 'postStatus',
				},
			},
		]
		const sql = SQL`CREATE DOMAIN "postStatus" AS text CONSTRAINT postStatus_check CHECK (VALUE IN('publish','draft','auto-draft'));
				ALTER TABLE "post" ADD "status" "postStatus";`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('update enum', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' }))
			)
			.enum('postStatus', ['publish', 'draft', 'auto-draft'])
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' }))
			)
			.enum('postStatus', ['publish', 'draft', 'auto-draft', "SQL', 'injection"])
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'updateEnum',
				enumName: 'postStatus',
				values: ['publish', 'draft', 'auto-draft', "SQL', 'injection"],
			},
		]
		const sql = SQL`ALTER DOMAIN "postStatus" DROP CONSTRAINT postStatus_check;
		ALTER DOMAIN "postStatus" ADD CONSTRAINT postStatus_check CHECK (VALUE IN('publish','draft','auto-draft','SQL\\', \\'injection'));`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('drop enum', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' }))
			)
			.enum('postStatus', ['publish', 'draft', 'auto-draft'])
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'removeField',
				entityName: 'Post',
				fieldName: 'status',
			},
			{
				modification: 'removeEnum',
				enumName: 'postStatus',
			},
		]
		const sql = SQL`ALTER TABLE "post" DROP "status";
				DROP DOMAIN "postStatus";`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('change column type', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.column('registeredAt', c => c.type(Model.ColumnType.Date))
			)
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.column('registeredAt', c => c.type(Model.ColumnType.DateTime))
			)
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'updateColumnDefinition',
				entityName: 'Author',
				fieldName: 'registeredAt',
				definition: {
					type: Model.ColumnType.DateTime,
					columnType: 'timestamp',
					nullable: true,
				},
			},
		]
		const sql = SQL`ALTER TABLE "author"
						ALTER "registered_at" SET DATA TYPE timestamp,
						ALTER "registered_at" DROP NOT NULL;`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('rename entity', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Author', e => e.tableName('user').column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('User', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'updateEntityName',
				entityName: 'Author',
				newEntityName: 'User',
			},
		]
		const sql = SQL``
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('rename field', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Author', e => e.column('firstName', c => c.type(Model.ColumnType.String).columnName('name')))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'updateFieldName',
				entityName: 'Author',
				fieldName: 'firstName',
				newFieldName: 'name',
			},
		]
		const sql = SQL``
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('drop relation (many has one)', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.manyHasOne('author', r => r.target('Author').onDelete(Model.OnDelete.cascade))
			)
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'removeField',
				entityName: 'Post',
				fieldName: 'author',
			},
		]
		const sql = SQL`ALTER TABLE "post" DROP "author_id";`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('drop relation (one has many)', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Post', e =>
				e.oneHasMany('locales', r =>
					r
						.target('PostLocale')
						.ownerNotNull()
						.ownedBy('post')
				)
			)
			.entity('PostLocale', e =>
				e
					.unique(['post', 'locale'])
					.column('title', c => c.type(Model.ColumnType.String))
					.column('locale', c => c.type(Model.ColumnType.String))
			)
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e => e)
			.entity('PostLocale', e =>
				e.column('title', c => c.type(Model.ColumnType.String)).column('locale', c => c.type(Model.ColumnType.String))
			)
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'removeField',
				entityName: 'Post',
				fieldName: 'locales',
			},
			{
				constraintName: 'unique_PostLocale_post_locale_5759e8',
				entityName: 'PostLocale',
				modification: 'removeUniqueConstraint',
			},
			{
				modification: 'removeField',
				entityName: 'PostLocale',
				fieldName: 'post',
			},
		]
		const sql = SQL`ALTER TABLE "post_locale" DROP CONSTRAINT "unique_PostLocale_post_locale_5759e8";
						ALTER TABLE "post_locale" DROP "post_id";`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('drop relation (many has many)', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Post', e =>
				e.column('title', c => c.type(Model.ColumnType.String)).manyHasMany('categories', r => r.target('Category'))
			)
			.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.entity('Category', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'removeField',
				entityName: 'Post',
				fieldName: 'categories',
			},
		]
		const sql = SQL`DROP TABLE "post_categories";`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('drop relation (one has one)', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'removeField',
				entityName: 'SiteSetting',
				fieldName: 'site',
			},
			{
				modification: 'removeUniqueConstraint',
				entityName: 'Site',
				constraintName: 'unique_Site_setting_8653a0',
			},
			{
				modification: 'removeField',
				entityName: 'Site',
				fieldName: 'setting',
			},
		]
		const sql = SQL`ALTER TABLE "site" DROP CONSTRAINT "unique_Site_setting_8653a0";
						ALTER TABLE "site" DROP "setting_id";`
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('drop relation inversed side (one has one)', () => {
		const originalSchema = new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site'))
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const updatedSchema = new SchemaBuilder()
			.entity('Site', entity =>
				entity.column('name', c => c.type(Model.ColumnType.String)).oneHasOne('setting', r => r.target('SiteSetting'))
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const diff: Migration.Modification[] = [
			{
				modification: 'removeField',
				entityName: 'SiteSetting',
				fieldName: 'site',
			},
		]
		const sql = SQL``
		it('diff schemas', () => {
			testDiffSchemas(originalSchema, updatedSchema, diff)
		})
		it('apply diff', () => {
			testApplyDiff(originalSchema, diff, updatedSchema)
		})
		it('generate sql', () => {
			testGenerateSql(originalSchema, diff, sql)
		})
	})

	describe('update ACL', () => {
		const model = new SchemaBuilder()
			.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema()
		const acl: Acl.Schema = {
			variables: {},
			roles: {
				admin: {
					stages: '*',
					entities: {
						Site: {
							predicates: {},
							operations: {
								read: {
									id: true,
								},
							},
						},
					},
				},
			},
		}
		const diff: Migration.Modification[] = [
			{
				modification: 'updateAclSchema',
				schema: acl,
			},
		]
		it('diff schemas', () => {
			const actual = schemaDiffer.diffSchemas({ model, acl: emptyAcl }, { model, acl })
			expect(actual).deep.equals(diff)
		})
		it('apply diff', () => {
			const actual = schemaMigrator.applyDiff({ model, acl: emptyAcl }, diff)
			expect(actual).deep.equals({ model, acl })
		})
	})
})

import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'

namespace ConvertOHMToMHMSchemaOrig {
	export class Article {
		title = def.stringColumn()
		category = def.manyHasOne(Category, 'articles')
	}

	export class Category {
		articles = def.oneHasMany(Article, 'category')
	}
}

namespace ConvertOHMToMHMSchemaOrigUpdated {
	export class Article {
		title = def.stringColumn()
		categories = def.manyHasMany(Category, 'articles')
	}

	export class Category {
		articles = def.manyHasManyInverse(Article, 'categories')
	}
}


testMigrations('convert one has many to many has many', {
	originalSchema: def.createModel(ConvertOHMToMHMSchemaOrig),
	updatedSchema: def.createModel(ConvertOHMToMHMSchemaOrigUpdated),
	diff: [
		{
			modification: 'convertOneHasManyToManyHasManyRelation',
			entityName: 'Article',
			fieldName: 'category',
			owningSide: {
				type: 'ManyHasMany',
				name: 'categories',
				inversedBy: 'articles',
				target: 'Category',
				joiningTable: {
					tableName: 'article_categories',
					joiningColumn: {
						columnName: 'article_id',
						onDelete: 'cascade',
					},
					inverseJoiningColumn: {
						columnName: 'category_id',
						onDelete: 'cascade',
					},
					eventLog: {
						enabled: true,
					},
				},
			},
			inverseSide: {
				name: 'articles',
				ownedBy: 'categories',
				target: 'Article',
				type: 'ManyHasMany',
			},
		},
	],
	sql: SQL`
	CREATE TABLE "article_categories" (
		"article_id" uuid NOT NULL REFERENCES "article"("id") ON DELETE CASCADE,
		"category_id" uuid NOT NULL REFERENCES "category"("id") ON DELETE CASCADE, CONSTRAINT
		"article_categories_pkey" PRIMARY KEY ("article_id", "category_id")
	);

	CREATE TRIGGER "log_event" AFTER INSERT OR UPDATE OR DELETE
	    ON "article_categories" FOR EACH ROW
	    EXECUTE PROCEDURE "system"."trigger_event"($pga$article_id$pga$, $pga$category_id$pga$);

	CREATE CONSTRAINT TRIGGER "log_event_trx" AFTER INSERT OR UPDATE OR DELETE
	    ON "article_categories" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
	    EXECUTE PROCEDURE "system"."trigger_event_commit"();

	INSERT INTO "article_categories" ( "article_id", "category_id" )
	SELECT "id", "category_id" FROM "article" WHERE "category_id" IS NOT NULL;

	ALTER TABLE "article" DROP "category_id";
	`,
})

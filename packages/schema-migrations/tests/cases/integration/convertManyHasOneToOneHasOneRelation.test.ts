import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createDatabaseMetadata } from '@contember/database'

namespace ConvertMHOtoOHOSchemaOrig {
	export class Article {
		title = def.stringColumn()
		reviews = def.oneHasMany(ArticleReview, 'article')
	}

	export class ArticleReview {
		article = def.manyHasOne(Article, 'reviews')
	}
}

namespace ConvertMHOtoOHOSchemaUpdated {
	export class Article {
		title = def.stringColumn()
		review = def.oneHasOneInverse(ArticleReview, 'article')
	}

	export class ArticleReview {
		article = def.oneHasOne(Article, 'review')
	}
}

describe('convert one has many to one has one', () => {
	testMigrations({
		original: createSchema(ConvertMHOtoOHOSchemaOrig),
		updated: createSchema(ConvertMHOtoOHOSchemaUpdated),
		diff: [{
			entityName: 'ArticleReview',
			fieldName: 'article',
			modification: 'convertOneHasManyToOneHasOneRelation',
			newInverseSideFieldName: 'review',
		}],
		sql: SQL`DROP INDEX "article_review_article_id_idx";
        ALTER TABLE "article_review"
            ADD UNIQUE ("article_id");`,
		databaseMetadata: createDatabaseMetadata({
			foreignKeys: [],
			indexes: [{
				indexName: 'article_review_article_id_idx',
				columnNames: ['article_id'],
				tableName: 'article_review',
			}],
			uniqueConstraints: [],
		}),
	})
})

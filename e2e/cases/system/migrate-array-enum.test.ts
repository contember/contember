import { expect, test } from 'bun:test'
import { createTester } from '../../src/tester'
import { c, createSchema } from '@contember/schema-definition'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator } from '@contember/schema-migrations'

namespace ArticleModelOriginal {
	export const ArticleTag = c.createEnum('a', 'b')
	export class Article {
		tags = c.enumColumn(ArticleTag).list().notNull()
	}
}

namespace ArticleModelUpdate {
	export const ArticleTag = c.createEnum('a', 'b', 'c')

	export class Article {
		tags = c.enumColumn(ArticleTag).list().notNull()
	}
}

const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))

test('update enum used in array', async () => {
	const origSchema = createSchema(ArticleModelOriginal)
	const tester = await createTester(origSchema)

	const updatedSchema = createSchema(ArticleModelUpdate)


	const migration = differ.diffSchemas(origSchema, updatedSchema)

	await tester(`mutation {
		createArticle(data: {tags: [a]}) {
			ok
		}
	}`)
		.expect({ data: {
			createArticle: {
				ok: true,
			},
		} })
		.expect(200)

	await tester.migrate(migration, '2024-08-01-120000-update-array')

	await tester(`mutation {
		createArticle(data: {tags: [c]}) {
			ok
		}
	}`)
		.expect(200)
		.expect(response => {
			expect(response.body.data.createArticle.ok).toBe(true)
		})
})

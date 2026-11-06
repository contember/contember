import { expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, validateAddedSql } from '../../../src/index.js'

namespace Base {
	export class Article {
		title = c.stringColumn()
	}
}

namespace MultiStatementView {
	export class Article {
		title = c.stringColumn()
	}

	@c.View('SELECT id, title FROM article; DELETE FROM article')
	export class ArticleView {
		title = c.stringColumn()
	}
}

namespace ChangedMultiStatementView {
	export class Article {
		title = c.stringColumn()
	}

	@c.View('SELECT id, title FROM article WHERE true; DELETE FROM article')
	export class ArticleView {
		title = c.stringColumn()
	}
}

namespace MultiStatementViewWithIndex {
	@c.Index({ fields: ['title'], where: "title <> ';'" })
	export class Article {
		title = c.stringColumn()
	}

	@c.View('SELECT id, title FROM article; DELETE FROM article')
	export class ArticleView {
		title = c.stringColumn()
	}
}

namespace TerminatedIndexPredicate {
	@c.Index({ fields: ['title'], where: 'title IS NOT NULL); DROP TABLE article; --' })
	export class Article {
		title = c.stringColumn()
	}
}

const base = createSchema(Base)
const multiStatementView = createSchema(MultiStatementView)

test('a new multi-statement view is rejected', () => {
	expect(validateAddedSql(base, multiStatementView)).toStrictEqual([
		{ code: 'MODEL_INVALID_VIEW', path: ['entities', 'ArticleView'], message: 'View SQL must be a single SQL statement.' },
	])
})

test('a changed view is checked again', () => {
	expect(validateAddedSql(multiStatementView, createSchema(ChangedMultiStatementView))).toHaveLength(1)
})

test('an unchanged view and a valid new index are not reported', () => {
	expect(validateAddedSql(multiStatementView, createSchema(MultiStatementViewWithIndex))).toStrictEqual([])
})

test('a new index predicate with a statement terminator is rejected', () => {
	expect(validateAddedSql(base, createSchema(TerminatedIndexPredicate))).toStrictEqual([
		{ code: 'MODEL_INVALID_INDEX', path: ['entities', 'Article', 'indexes'], message: 'Index predicate (where) must not contain ";".' },
	])
})

test('the differ rejects added invalid SQL but keeps diffing a schema that already contains it', () => {
	const differ = new SchemaDiffer(new SchemaMigrator(new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)))
	expect(() => differ.diffSchemas(base, multiStatementView)).toThrow('updated schema contains invalid SQL')
	expect(differ.diffSchemas(multiStatementView, createSchema(MultiStatementViewWithIndex))).toHaveLength(1)
})

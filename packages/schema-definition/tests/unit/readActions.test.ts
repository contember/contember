import { c } from '../../src'
import { expect, test } from 'vitest'
import { createActions } from '../../src/actions/definition'

namespace SimpleActions {

	@c.Watch({
		name: 'book_watch',
		watch: `
			title
			tags {
				name
			}
		`,
		webhook: '%webhookUrl%/book/updated',
	})
	export class Book {
		title = c.stringColumn()
		tags = c.manyHasMany(Tag)
		category = c.manyHasOne(Category)
	}

	export class Tag {
		locales = c.oneHasMany(TagLocale, 'tag')
	}

	@c.Unique('tag', 'locale')
	export class TagLocale {
		tag = c.manyHasOne(Tag, 'locales')
		name = c.stringColumn()
		locale = c.manyHasOne(Locale)
	}


	export class Category {
		locales = c.oneHasMany(CategoryLocale, 'category')
	}

	@c.Unique('category', 'locale')
	export class CategoryLocale {
		category = c.manyHasOne(Category, 'locales')
		name = c.stringColumn()
		locale = c.manyHasOne(Locale)
	}

	export class Locale {
		code = c.stringColumn().notNull().unique()
	}
}

test('read actions schema', () => {
	expect(createActions(SimpleActions)).toMatchInlineSnapshot(`
		{
		  "targets": {
		    "book_watch_target": {
		      "name": "book_watch_target",
		      "type": "webhook",
		      "url": "%webhookUrl%/book/updated",
		    },
		  },
		  "triggers": {
		    "book_watch": {
		      "entity": "Book",
		      "name": "book_watch",
		      "selection": undefined,
		      "target": "book_watch_target",
		      "type": "watch",
		      "watch": [
		        "title",
		        [
		          "tags",
		          {},
		          [
		            "name",
		          ],
		        ],
		      ],
		    },
		  },
		}
	`)
})

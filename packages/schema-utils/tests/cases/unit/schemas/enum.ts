import { c } from '@contember/schema-definition'

export const articleState = c.createEnum('draft', 'published')

export class Article {
	title = c.stringColumn()
	state = c.enumColumn(articleState).notNull().default('draft')
}

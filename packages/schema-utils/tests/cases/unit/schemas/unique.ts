import { c } from '@contember/schema-definition'

@c.Unique('title')
export class Article {
	title = c.stringColumn()
}

import { c } from '@contember/schema-definition'

@c.View(`SELECT * FROM article`)
export class Article {
	title = c.stringColumn()
}

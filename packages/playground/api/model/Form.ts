import { c } from '@contember/schema-definition'

export const FormArticleState = c.createEnum('published', 'draft', 'archived')


export class FormArticle {
	state = c.enumColumn(FormArticleState)
	locked = c.boolColumn().default(false)
	internalName = c.stringColumn().notNull()
	publishedAt = c.dateTimeColumn()
	author = c.manyHasOne(FormAuthor, 'articles').setNullOnDelete()
	tags = c.manyHasMany(FormTag, 'articles')
	locales = c.oneHasMany(FormArticleLocale, 'article')
	notes = c.oneHasMany(FormNote, 'article')
}

@c.Unique('article', 'locale')
export class FormArticleLocale {
	locale = c.enumColumn(c.createEnum('cs', 'en')).notNull()
	article = c.manyHasOne(FormArticle, 'locales').notNull().cascadeOnDelete()
	title = c.stringColumn()
	content = c.stringColumn()
	slug = c.stringColumn().notNull().unique()
}

export class FormTag {
	name = c.stringColumn().notNull()
	slug = c.stringColumn().notNull().unique()
	articles = c.manyHasManyInverse(FormArticle, 'tags')
}

export class FormAuthor {
	name = c.stringColumn().notNull()
	slug = c.stringColumn().notNull().unique()
	articles = c.oneHasMany(FormArticle, 'author')
}

export class FormNote {
	article = c.manyHasOne(FormArticle, 'notes').cascadeOnDelete().notNull()
	createdAt = c.dateTimeColumn().notNull().default('now')
	text = c.stringColumn().notNull()
}

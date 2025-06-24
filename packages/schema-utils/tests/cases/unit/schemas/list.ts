import { c } from '@contember/schema-definition'

export const ArticleEnumArrayValue = c.createEnum('a', 'b', 'c')

export class Article {
	title = c.stringColumn().notNull()
	description = c.stringColumn()
	stringArrayValue = c.stringColumn().list()
	enumArrayValue = c.enumColumn(ArticleEnumArrayValue).list()
	intArrayValue = c.intColumn().list()
	floatArrayValue = c.doubleColumn().list()
	booleanArrayValue = c.boolColumn().list()
	jsonArrayValue = c.jsonColumn().list()
	notNullStringArray = c.stringColumn().notNull().list()
	defaultValueArray = c.stringColumn().default('default').list()
	uniqueIntArray = c.intColumn().list()
	nestedJsonArray = c.jsonColumn().list()
}

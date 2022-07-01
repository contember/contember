import { SchemaDefinition as d } from '@contember/schema-definition'
import { One } from './One'


export const SomeEnum = d.createEnum('a', 'b', 'c')

export class InputShowcase {
	unique = d.enumColumn(One).notNull().unique()
	textValue = d.stringColumn()
	notNullTextValue = d.stringColumn().notNull()
	slugValue = d.stringColumn()
	emailValue = d.stringColumn()
	searchValue = d.stringColumn()
	urlValue = d.stringColumn()
	multilineValue = d.stringColumn()
	boolValue = d.boolColumn()
	intValue = d.intColumn()
	floatValue = d.doubleColumn()
	timeValue = d.stringColumn()
	dateValue = d.dateColumn()
	dateTimeValue = d.dateTimeColumn()
	gpsLatValue = d.doubleColumn()
	gpsLonValue = d.doubleColumn()
	enumValue = d.enumColumn(SomeEnum)
	selectValue = d.enumColumn(SomeEnum)
	blocks = d.oneHasMany(RepeaterBlock, 'page')
	jsonValue = d.jsonColumn()
}

export const ContentBlockType = d.createEnum(
	'heroSection',
)

export class RepeaterBlock {
	primaryText = d.stringColumn()
	type = d.enumColumn(ContentBlockType).notNull()
	order = d.intColumn().notNull()
	page = d.manyHasOne(InputShowcase, 'blocks').setNullOnDelete()
}

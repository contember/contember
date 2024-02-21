import { c } from '@contember/schema-definition'

export const InputUnique = c.createEnum('unique')

export class InputRoot {
	unique = c.enumColumn(InputUnique).notNull().unique()
	textValue = c.stringColumn()
	intValue = c.intColumn()
	floatValue = c.doubleColumn()
	boolValue = c.boolColumn()
	dateValue = c.dateColumn()
	datetimeValue = c.dateTimeColumn()
	jsonValue = c.jsonColumn()
	enumValue = c.enumColumn(c.createEnum('a', 'b', 'c'))
	uuidValue = c.uuidColumn()
}

export class InputRules {
	unique = c.enumColumn(InputUnique).notNull().unique()
	notNullValue = c.stringColumn().notNull()
	uniqueValue = c.stringColumn().unique()
	@c.AssertPattern(/^[a-z]+$/, 'Invalid value')
	validationValue = c.stringColumn()
}

import { c } from '@contember/schema-definition'

export const InputUnique = c.createEnum('unique')

export class InputRoot {
	unique = c.enumColumn(InputUnique).notNull().unique()
	dummy = c.stringColumn()
	textValue = c.stringColumn()
	intValue = c.intColumn()
	floatValue = c.doubleColumn()
	boolValue = c.boolColumn()
	dateValue = c.dateColumn()
	datetimeValue = c.dateTimeColumn()
	timeValue = c.timeColumn()
	jsonValue = c.jsonColumn()
	enumValue = c.enumColumn(c.createEnum('a', 'b', 'c'))
	uuidValue = c.uuidColumn()

	stringArrayValue = c.stringColumn().list()
	enumArrayValue = c.enumColumn(c.createEnum('a', 'b', 'c')).list()
	intArrayValue = c.intColumn().list()
}

export class InputRules {
	notNullValue = c.stringColumn().notNull()
	uniqueValue = c.stringColumn().unique()
	@c.AssertPattern(/^[a-z]+$/, 'Invalid value')
	validationValue = c.stringColumn()
}

import * as Knex from 'knex'

export type Value =
	| string
	| number
	| boolean
	| Date
	| Array<string>
	| Array<number>
	| Array<Date>
	| Array<boolean>
	| Buffer
	| Knex.Raw

export interface Formatter {
	bindings: Array<any>

	wrap(value: any): string

	wrapString(value: string): string

	columnize(target: any): string

	parametrize(values: any): string

	values(values: Array<any>): string

	parameter(values: any): string

	operator(values: string): string
}

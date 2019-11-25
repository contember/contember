import * as React from 'react'
import { Environment } from '../dao'
import { Parser } from './Parser'

export namespace QueryLanguage {
	const prepareEntryPoint = <Entry extends Parser.EntryPoint>(entryPoint: Entry) => (
		input: string | Parser.ParserResult[Entry],
		environment: Environment,
	): Parser.ParserResult[Entry] => {
		if (typeof input === 'string') {
			return Parser.parseQueryLanguageExpression(input, entryPoint, environment)
		}
		return input
	}

	export const parseQualifiedEntityList = prepareEntryPoint(Parser.EntryPoint.QualifiedEntityList)
	export const parseQualifiedFieldList = prepareEntryPoint(Parser.EntryPoint.QualifiedFieldList)
	export const parseRelativeSingleField = prepareEntryPoint(Parser.EntryPoint.RelativeSingleField)
	export const parseRelativeSingleEntity = prepareEntryPoint(Parser.EntryPoint.RelativeSingleEntity)
	export const parseRelativeEntityList = prepareEntryPoint(Parser.EntryPoint.RelativeEntityList)
	export const parseUniqueWhere = prepareEntryPoint(Parser.EntryPoint.UniqueWhere)
	export const parseFilter = prepareEntryPoint(Parser.EntryPoint.Filter)
	export const parseOrderBy = prepareEntryPoint(Parser.EntryPoint.OrderBy)
}

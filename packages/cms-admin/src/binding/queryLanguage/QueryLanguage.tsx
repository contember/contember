import * as React from 'react'
import { FieldName } from '../bindingTypes'
import { ToOne } from '../coreComponents'
import { Environment } from '../dao'
import { Parser } from './Parser'

export namespace QueryLanguage {
	export const wrapRelativeSingleField = (
		input: string,
		generateField: (fieldName: FieldName) => React.ReactNode,
		environment?: Environment
	): React.ReactNode => {
		const expression = Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeSingleField, environment)
		let currentNode = generateField(expression.fieldName)

		for (let i = expression.toOneProps.length - 1; i >= 0; i--) {
			const currentProps = expression.toOneProps[i]
			currentNode = <ToOne {...currentProps}>{currentNode}</ToOne>
		}

		return currentNode
	}

	export const wrapRelativeSingleEntity = (
		input: string,
		subordinateFields: React.ReactNode,
		environment?: Environment
	): React.ReactNode => {
		const expression = Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeSingleEntity, environment)
		let currentNode = subordinateFields

		for (let i = expression.toOneProps.length - 1; i >= 0; i--) {
			const currentProps = expression.toOneProps[i]
			currentNode = <ToOne {...currentProps}>{currentNode}</ToOne>
		}

		return currentNode
	}
}

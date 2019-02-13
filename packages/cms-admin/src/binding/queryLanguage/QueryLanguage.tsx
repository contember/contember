import * as React from 'react'
import { EntityName, FieldName, Filter } from '../bindingTypes'
import { ToMany, ToOne } from '../coreComponents'
import { Environment } from '../dao'
import { Parser } from './Parser'

export namespace QueryLanguage {
	const wrap = <P extends {}>(
		innerNode: React.ReactNode,
		Component: React.ComponentClass<P>,
		layers: P[]
	): React.ReactNode => {
		let currentNode: React.ReactNode = innerNode

		for (let i = layers.length - 1; i >= 0; i--) {
			const currentProps = layers[i]
			currentNode = <Component {...currentProps}>{currentNode}</Component>
		}

		return currentNode
	}

	export const wrapRelativeSingleField = (
		input: string,
		generateField: (fieldName: FieldName) => React.ReactNode,
		environment?: Environment
	): React.ReactNode => {
		const expression = Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeSingleField, environment)

		return wrap(generateField(expression.fieldName), ToOne, expression.toOneProps)
	}

	export const wrapRelativeSingleEntity = (
		input: string,
		subordinateFields: React.ReactNode,
		environment?: Environment
	): React.ReactNode => {
		const { toOneProps } = Parser.parseQueryLanguageExpression(
			input,
			Parser.EntryPoint.RelativeSingleEntity,
			environment
		)

		return wrap(subordinateFields, ToOne, toOneProps)
	}

	export const wrapRelativeEntityList = (
		input: string,
		subordinateFields: React.ReactNode,
		environment?: Environment
	): React.ReactNode => {
		const { toManyProps } = Parser.parseQueryLanguageExpression(
			input,
			Parser.EntryPoint.RelativeEntityList,
			environment
		)

		return wrap(subordinateFields, ToMany, toManyProps)
	}

	export const wrapQualifiedFieldList = (
		input: string,
		generateField: (fieldName: FieldName) => React.ReactNode,
		environment?: Environment
	): {
		entityName: EntityName
		filter?: Filter
		children: React.ReactNode
		fieldName: FieldName
	} => {
		const { entityName, filter, fieldName, toManyProps } = Parser.parseQueryLanguageExpression(
			input,
			Parser.EntryPoint.QualifiedFieldList,
			environment
		)

		return {
			fieldName,
			entityName,
			filter,
			children: wrap(generateField(fieldName), ToMany, toManyProps)
		}
	}
}

import * as React from 'react'
import { EntityName, FieldName, Filter } from '../bindingTypes'
import { ToMany, ToOne } from '../coreComponents'
import { Environment } from '../dao'
import { reactNodeToElement } from '../utils'
import { Parser } from './Parser'

export namespace QueryLanguage {
	const wrap = <P extends {}>(
		innerNode: React.ReactNode,
		Component: React.ComponentType<P & { environment: Environment }>,
		layers: P[],
		environment: Environment,
	): React.ReactElement | null => {
		let currentNode: React.ReactNode = innerNode

		for (let i = layers.length - 1; i >= 0; i--) {
			const currentProps = layers[i]
			currentNode = (
				<Component {...currentProps} environment={environment}>
					{currentNode}
				</Component>
			)
		}

		return reactNodeToElement(currentNode)
	}

	export const wrapRelativeSingleField = (
		input: string,
		generateField: (fieldName: FieldName) => React.ReactNode,
		environment: Environment,
	): React.ReactElement | null => {
		const expression = Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.RelativeSingleField, environment)

		return wrap(generateField(expression.fieldName), ToOne.AtomicPrimitive, expression.toOneProps, environment)
	}

	export const wrapRelativeSingleEntity = (
		input: string,
		subordinateFields: React.ReactNode,
		environment: Environment,
	): React.ReactElement | null => {
		const { toOneProps } = Parser.parseQueryLanguageExpression(
			input,
			Parser.EntryPoint.RelativeSingleEntity,
			environment,
		)

		return wrap(subordinateFields, ToOne.AtomicPrimitive, toOneProps, environment)
	}

	export const wrapRelativeEntityList = (
		input: string,
		generateAtomicToMany: (atomicPrimitiveProps: ToMany.AtomicPrimitiveProps) => React.ReactNode,
		environment: Environment,
	): React.ReactElement | null => {
		const { toOneProps, toManyProps } = Parser.parseQueryLanguageExpression(
			input,
			Parser.EntryPoint.RelativeEntityList,
			environment,
		)

		return wrap(generateAtomicToMany(toManyProps), ToOne.AtomicPrimitive, toOneProps, environment)
	}

	export interface WrappedQualifiedEntityList {
		entityName: EntityName
		filter?: Filter
		children: React.ReactElement | null
	}
	export const wrapQualifiedEntityList = (
		input: string,
		fieldSelection: React.ReactNode,
		environment: Environment,
	): WrappedQualifiedEntityList => {
		const { entityName, filter, toOneProps } = Parser.parseQueryLanguageExpression(
			input,
			Parser.EntryPoint.QualifiedEntityList,
			environment,
		)

		return {
			entityName,
			filter,
			children: wrap(fieldSelection, ToOne.AtomicPrimitive, toOneProps, environment),
		}
	}

	export interface WrappedQualifiedFieldList {
		entityName: EntityName
		filter?: Filter
		children: React.ReactElement | null
		fieldName: FieldName
	}
	export const wrapQualifiedFieldList = (
		input: string,
		generateField: (fieldName: FieldName) => React.ReactNode,
		environment: Environment,
	): WrappedQualifiedFieldList => {
		const { entityName, filter, fieldName, toOneProps } = Parser.parseQueryLanguageExpression(
			input,
			Parser.EntryPoint.QualifiedFieldList,
			environment,
		)

		return {
			fieldName,
			entityName,
			filter,
			children: wrap(generateField(fieldName), ToOne.AtomicPrimitive, toOneProps, environment),
		}
	}

	export const parseUniqueWhere = (input: string, environment: Environment) =>
		Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.UniqueWhere, environment)

	export const parseFilter = (input: string, environment: Environment) =>
		Parser.parseQueryLanguageExpression(input, Parser.EntryPoint.Filter, environment)
}

import { Model } from '@contember/schema'

const upperCaseFirstLetter = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

export const getEnumTypeName = (enumName: string): string => upperCaseFirstLetter(enumName)

export type GenerateOptions = {
	/** Leave deprecated entities and fields out of the generated client. By default they are kept and marked `@deprecated`. */
	excludeDeprecated?: boolean
}

export const isEntityExcluded = (entity: Model.Entity, options?: GenerateOptions): boolean =>
	!!options?.excludeDeprecated && entity.deprecationReason !== undefined

export const isColumnExcluded = (column: Model.AnyColumn, options?: GenerateOptions): boolean =>
	!!options?.excludeDeprecated && column.deprecationReason !== undefined

export const isRelationExcluded = (relation: Model.AnyRelation, targetEntity: Model.Entity, options?: GenerateOptions): boolean =>
	!!options?.excludeDeprecated && (relation.deprecationReason !== undefined || targetEntity.deprecationReason !== undefined)

/** A JSDoc block with the description and the deprecation reason, or an empty string when there is neither. */
export const formatDocComment = (indent: string, annotated: { description?: string; deprecationReason?: string }): string => {
	const lines = [
		...(annotated.description !== undefined ? annotated.description.split('\n') : []),
		...(annotated.deprecationReason !== undefined ? [`@deprecated ${annotated.deprecationReason}`.trimEnd()] : []),
	]
	if (lines.length === 0) {
		return ''
	}
	const escaped = lines.map(line => line.replaceAll('*/', '*\\/'))
	return `${indent}/**\n${escaped.map(line => `${indent} * ${line}`.trimEnd()).join('\n')}\n${indent} */\n`
}

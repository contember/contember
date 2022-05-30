import type { RuntimeId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import type { PlaceholderName, TreeRootId } from '../../treeParameters'
import { mutationOperationSubTreeType } from './mutationOperationSubTreeType'
import type { mutationOperationType } from './mutationOperationType'
import type { TopLevelMutationOperation } from './TopLevelMutationOperation'

const mutationAliasRegex = /^(?:(u)|(t)([^t]+)t)(.+)__([cud])([sl])(.+)$/

const uuidToAliasRegex = /-/g
const uuidToAliasReplacement = '_'

const aliasToUuidRegex = /_/g
const aliasToUuidReplacement = '-'

// This is just a random character we use to make sure the alias doesn't start with a number as UUIDs often do.
const standaloneUuidPrefix = uuidToAliasReplacement

export class MutationAlias {
	public static encodeTopLevel(operation: TopLevelMutationOperation): string {
		const treeRootId = operation.treeRootId === undefined ? 'u' : `t${operation.treeRootId.replace('-', '_')}t`
		const entityId = String(operation.entityId).replace(uuidToAliasRegex, uuidToAliasReplacement)

		const alias = `${treeRootId}${operation.subTreePlaceholder}__${operation.type}${operation.subTreeType}${entityId}`

		if (import.meta.env.DEV) {
			const matches = alias.match(mutationAliasRegex)

			if (!matches) {
				throw new BindingError()
			}
		}

		return alias
	}

	public static decodeTopLevel(alias: string): TopLevelMutationOperation | undefined {
		const matches = alias.match(mutationAliasRegex)

		if (!matches) {
			return undefined
		}
		const treeRootId: TreeRootId | undefined = matches[1] === 'u' ? undefined : matches[3]
		const subTreePlaceholder: PlaceholderName = matches[4]
		const type = matches[5] as typeof mutationOperationType[keyof typeof mutationOperationType]
		const subTreeType =
			matches[6] === 's' ? mutationOperationSubTreeType.singleEntity : mutationOperationSubTreeType.entityList
		const entityId = matches[7].replace(aliasToUuidRegex, aliasToUuidReplacement)

		return {
			treeRootId,
			subTreePlaceholder,
			type,
			subTreeType,
			entityId,
		}
	}

	public static encodeEntityId(entityId: RuntimeId): string {
		return `${standaloneUuidPrefix}${String(entityId.value).replace(uuidToAliasRegex, uuidToAliasReplacement)}`
	}

	public static decodeEntityId(alias: string): RuntimeId['value'] {
		const stringId = `${alias.substring(standaloneUuidPrefix.length).replace(aliasToUuidRegex, aliasToUuidReplacement)}`
		const intId = parseInt(stringId)
		return intId.toString() === stringId ? intId : stringId
	}
}

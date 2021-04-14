import { RuntimeId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { PlaceholderName, TreeRootId } from '../../treeParameters'
import { MutationOperationSubTreeType } from './MutationOperationSubTreeType'
import { MutationOperationType } from './MutationOperationType'
import { TopLevelMutationOperation } from './TopLevelMutationOperation'

const mutationAliasRegex = /^(?:(u)|(t)([^t]+)t)(.+)__([cud])([sl])(.+)$/

const uuidToAliasRegex = /-/g
const uuidToAliasReplacement = '_'

const aliasToUuidRegex = /_/g
const aliasToUuidReplacement = '-'

// This is just a random character we use to make sure the alias doesn't start with a number as UUIDs often do.
const standaloneUuidPrefix = uuidToAliasReplacement

export class MutationAlias {
	public static encodeTopLevel(operation: TopLevelMutationOperation): string {
		const treeRootId = operation.treeRootId === undefined ? 'u' : `t${operation.treeRootId}t`
		const entityId = operation.entityId.replace(uuidToAliasRegex, uuidToAliasReplacement)

		const alias = `${treeRootId}${operation.subTreePlaceholder}__${operation.type}${operation.subTreeType}${entityId}`

		if (__DEV_MODE__) {
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
		const type = matches[5] as MutationOperationType
		const subTreeType =
			matches[6] === 's' ? MutationOperationSubTreeType.SingleEntity : MutationOperationSubTreeType.EntityList
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
		return `${standaloneUuidPrefix}${entityId.value.replace(uuidToAliasRegex, uuidToAliasReplacement)}`
	}

	public static decodeEntityId(alias: string): RuntimeId['value'] {
		return `${alias.substring(standaloneUuidPrefix.length).replace(aliasToUuidRegex, aliasToUuidReplacement)}`
	}
}

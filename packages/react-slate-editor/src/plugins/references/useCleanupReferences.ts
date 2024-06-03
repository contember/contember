import { EntityId, SugaredRelativeEntityList } from '@contember/binding'
import { useEntityBeforePersist, useEntityList } from '@contember/react-binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Descendant, Editor, Element } from 'slate'
import { isElementWithReference } from './elements'

export const useCleanupReferences = ({ field, editor }: {
	field: SugaredRelativeEntityList['field']
	editor: Editor
}): void => {
	const referenceList = useEntityList({ field })
	const cleanup = useReferentiallyStableCallback(() => {
		const references: EntityId[] = []
		const collectReferences = (nodes: Descendant[]) => {
			for (const node of nodes) {
				if (isElementWithReference(node)) {
					references.push(node.referenceId)
				}
				if (Element.isElement(node) && node.children) {
					collectReferences(node.children)
				}
			}
		}
		collectReferences(editor.children)

		for (const entity of Array.from(referenceList)) {
			if (!references.includes(entity.id)) {
				entity.deleteEntity()
			}
		}
	})
	useEntityBeforePersist(cleanup)
}

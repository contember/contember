import { Element, Node, Text } from 'slate'

// This isn't necessarily meant to represent an actual element that will appear in the editor.
export interface ElementWithReference extends Element {
	referenceId: string
}

export const isElementWithReference = (candidate: Node): candidate is ElementWithReference => {
	return !Text.isText(candidate) && 'referenceId' in candidate && candidate.referenceId
}

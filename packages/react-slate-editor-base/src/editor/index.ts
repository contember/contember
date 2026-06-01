import {
	addMarks,
	canToggleMark,
	closest,
	closestBlockEntry,
	closestViableBlockContainerEntry,
	ejectElement,
	elementToSpecifics,
	getElementDataAttributes,
	getPreviousSibling,
	hasMarks,
	hasParentOfType,
	isElementType,
	permissivelyDeserializeNodes,
	removeMarks,
	serializeNodes,
	strictlyDeserializeNodes,
	textToSpecifics,
	toLatestFormat,
	topLevelNodes,
} from './methods/index.js'

export type { ElementDataAttributes } from './methods/index.js'

// TODO use export * as ContemberEditor from './methods/index.js' once the tooling is ready.
export const ContemberEditor = {
	addMarks,
	canToggleMark,
	closest,
	closestBlockEntry,
	closestViableBlockContainerEntry,
	ejectElement,
	elementToSpecifics,
	getElementDataAttributes,
	getPreviousSibling,
	hasMarks,
	hasParentOfType,
	isElementType,
	permissivelyDeserializeNodes,
	removeMarks,
	serializeNodes,
	strictlyDeserializeNodes,
	textToSpecifics,
	toLatestFormat,
	topLevelNodes,
}

export * from './createEditor.js'

import { EntityAccessor } from '@contember/binding'
import { IconSourceSpecification } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { Range as SlateRange } from 'slate'
import { SugaredDiscriminateBy } from '../../discrimination'
import { ElementNode, ElementSpecifics, TextNode, TextSpecifics } from '../baseEditor'
import { BlockSlateEditor } from '../blockEditor'

export interface MarkSpecificToolbarButton<T extends TextNode> {
	marks: TextSpecifics<T>
}

export interface ElementSpecificToolbarButton<E extends ElementNode> {
	elementType: E['type']
	suchThat?: ElementSpecifics<E>
}

export interface InitializeReferenceContentProps {
	referenceId: string
	editor: BlockSlateEditor
	selection: SlateRange | null
	onSuccess: () => void
	onCancel: () => void
}
export interface InitializeReferenceSpecificToolbarButton {
	discriminateBy: SugaredDiscriminateBy
	initializeReference?: EntityAccessor.BatchUpdatesHandler
	referenceContent: FunctionComponent<InitializeReferenceContentProps>
}

export interface CommonToolbarButton extends IconSourceSpecification {
	label: ReactNode
	title?: string
}

export type ElementToolbarButton<E extends ElementNode> = CommonToolbarButton & ElementSpecificToolbarButton<E>
export type MarkToolbarButton<T extends TextNode> = CommonToolbarButton & MarkSpecificToolbarButton<T>
export type InitializeReferenceToolbarButton = CommonToolbarButton & InitializeReferenceSpecificToolbarButton

export type ToolbarButtonSpec = ElementToolbarButton<any> | MarkToolbarButton<any> | InitializeReferenceToolbarButton

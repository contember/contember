import { EditorHeading } from '@contember/ui'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { RenderElementProps } from 'slate-react'
import { HeadingElement } from './HeadingElement'

export interface HeadingRendererProps extends Omit<RenderElementProps, 'element'> {
	element: HeadingElement
}

export const HeadingRenderer: FunctionComponent<HeadingRendererProps> = ({
	attributes,
	element,
	children,
}: HeadingRendererProps) => (
	// TODO use BlockElement
	<EditorHeading attributes={attributes} level={element.level} isNumbered={element.isNumbered}>
		{children}
	</EditorHeading>
)
HeadingRenderer.displayName = 'HeadingRenderer'

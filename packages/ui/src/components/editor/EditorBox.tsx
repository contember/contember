import cn from 'classnames'
import {
	ReactNode,
	ReactElement,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	ComponentType,
	MouseEvent as ReactMouseEvent,
	memo,
	useState,
	useContext,
} from 'react'
import { IncreaseBoxDepth, IncreaseHeadingDepth, useClassNamePrefix } from '../../auxiliary'
import { BoxDepthContext, HeadingDepthContext } from '../../contexts'
import { NativeProps } from '../../types'
import { toStateClass } from '../../utils'
import { Heading } from '../Heading'

export interface EditorBoxOwnProps {
	heading?: ReactNode
	children: ReactNode
	isActive?: boolean
}

export interface EditorBoxProps extends EditorBoxOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const EditorBox = memo(function EditorBox({
	children,
	heading,
	isActive = false,
	className,
	...divProps
}: EditorBoxProps) {
	const prefix = useClassNamePrefix()
	const boxDepth = useContext(BoxDepthContext)
	const headingDepth = useContext(HeadingDepthContext)

	return (
		<div className={cn(`${prefix}editorBox`, toStateClass('active', isActive), className)} {...divProps}>
			{heading !== undefined && (
				<div className={`${prefix}editorBox-heading`} contentEditable={false}>
					<Heading depth={headingDepth} size="small" /*distinction="subtle"*/>
						{heading}
					</Heading>
				</div>
			)}
			{children !== undefined && (
				<div className={`${prefix}editorBox-content`}>
					<IncreaseHeadingDepth currentDepth={headingDepth} onlyIf={heading !== undefined}>
						<IncreaseBoxDepth currentDepth={boxDepth}>{children}</IncreaseBoxDepth>
					</IncreaseHeadingDepth>
				</div>
			)}
		</div>
	)
})

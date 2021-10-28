import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { NativeProps } from '../../types'
import { toStateClass } from '../../utils'
import { Stack } from '../Stack'
import { Heading } from '../Typography/Heading'

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

	return (
		<div className={cn(`${prefix}editorBox`, toStateClass('active', isActive), className)} {...divProps}>
			{heading !== undefined && (
				<div className={`${prefix}editorBox-heading`} contentEditable={false}>
					<Heading size="small">
						{heading}
					</Heading>
				</div>
			)}
			{children !== undefined && (
				<Stack direction="vertical" className={`${prefix}editorBox-content`}>
					{children}
				</Stack>
			)}
		</div>
	)
})

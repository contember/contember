import cn from 'classnames'
import * as React from 'react'
import { IncreaseBoxDepth, IncreaseHeadingDepth, useClassNamePrefix } from '../../auxiliary'
import { BoxDepthContext, HeadingDepthContext } from '../../contexts'
import { BoxDistinction } from '../../types'
import { toEnumViewClass, toStateClass, toViewClass } from '../../utils'
import { Heading } from '../Heading'

export interface BoxProps {
	heading?: React.ReactNode
	actions?: React.ReactNode
	children: React.ReactNode
	distinction?: BoxDistinction
	isActive?: boolean
}

export const Box = React.memo(({ actions, children, heading, distinction, isActive = false }: BoxProps) => {
	const boxDepth = React.useContext(BoxDepthContext)
	const headingDepth = React.useContext(HeadingDepthContext)
	const prefix = useClassNamePrefix()

	return (
		<div
			className={cn(
				`${prefix}box`,
				toViewClass(`depth-${boxDepth}`, true),
				toEnumViewClass(distinction),
				toStateClass('active', isActive),
			)}
		>
			{heading && (
				<div className={`${prefix}box-heading`}>
					<Heading depth={headingDepth} size="small">
						{heading}
					</Heading>
				</div>
			)}
			{actions && <div className={`${prefix}box-actions`}>{actions}</div>}
			<div className={`${prefix}box-content`}>
				<IncreaseHeadingDepth currentDepth={headingDepth} onlyIf={!!heading}>
					<IncreaseBoxDepth currentDepth={boxDepth} onlyIf={distinction !== 'seamlessIfNested'}>
						{children}
					</IncreaseBoxDepth>
				</IncreaseHeadingDepth>
			</div>
		</div>
	)
})
Box.displayName = 'Box'

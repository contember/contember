import cn from 'classnames'
import * as React from 'react'
import { IncreaseHeadingDepth } from '../../auxiliary'
import { HeadingDepthContext } from '../../contexts'
import { BoxDistinction } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'
import { Heading } from '../Heading'

export interface BoxProps {
	heading?: React.ReactNode
	actions?: React.ReactNode
	children: React.ReactNode
	distinction?: BoxDistinction
}

export const Box = React.memo(({ actions, children, heading, distinction }: BoxProps) => {
	const headingDepth = React.useContext(HeadingDepthContext)

	return (
		<div className={cn('box', toViewClass(`depth-${headingDepth}`, true), toEnumViewClass(distinction))}>
			{heading && (
				<div className="box-heading">
					<Heading depth={headingDepth} size="small">
						{heading}
					</Heading>
				</div>
			)}
			{actions && <div className="box-actions">{actions}</div>}
			<div className="box-content">
				<IncreaseHeadingDepth currentDepth={headingDepth}>{children}</IncreaseHeadingDepth>
			</div>
		</div>
	)
})

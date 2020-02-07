import * as React from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { ContemberLogo } from './ContemberLogo'
export interface LayoutHeadingProps {
	label?: React.ReactNode
}
export function LayoutHeading({ label }: LayoutHeadingProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}layoutHeading`}>
			<div className={`${prefix}layoutHeading-logo`}>
				<ContemberLogo size={label ? 2 : 1} logotyp={!label} />
			</div>
			{label && <div className={`${prefix}layoutHeading-label`}>{label}</div>}
		</div>
	)
}
LayoutHeading.displayName = 'LayoutHeading'

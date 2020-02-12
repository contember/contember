import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'

export interface ContemberLogoProps {
	logotype?: boolean
	baseline?: boolean
	size?: number
}

export const ContemberLogo = ({ logotype, baseline, size }: ContemberLogoProps) => {
	const prefix = useClassNamePrefix()
	return (
		<span
			className={cn(`${prefix}contemberLogo`, logotype && 'view-logotype', baseline && 'view-baseline')}
			style={{ fontSize: `${size ?? 1}em` }}
		>
			<span className={`${prefix}contemberLogo-image`} />
		</span>
	)
}
ContemberLogo.displayName = 'ContemberLogo'

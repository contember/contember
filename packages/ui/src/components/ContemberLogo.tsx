import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'

export interface ContemberLogoProps {
	logotyp?: boolean
	baseline?: boolean
	size?: number
}

export const ContemberLogo = ({ logotyp, baseline, size }: ContemberLogoProps) => {
	const prefix = useClassNamePrefix()
	return (
		<span
			className={cn(`${prefix}contemberLogo`, logotyp && 'view-logotyp', baseline && 'view-baseline')}
			style={{ fontSize: `${size ?? 1}em` }}
		>
			<span className={`${prefix}contemberLogo-image`} />
		</span>
	)
}
ContemberLogo.displayName = 'ContemberLogo'

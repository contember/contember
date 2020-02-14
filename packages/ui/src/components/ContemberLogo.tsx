import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'
import { Size } from '../types'

export interface ContemberLogoProps {
	logotype?: boolean
	size?: Size | number
}

const logoSizes: { [key in Size]: number } = {
	default: 1,
	large: 2,
	small: 0.75,
}

export const ContemberLogo = ({ logotype, size }: ContemberLogoProps) => {
	const prefix = useClassNamePrefix()

	let fontSize: string | undefined

	switch (typeof size) {
		case 'number':
			fontSize = `${size}em`
			break
		case 'string':
			fontSize = `${logoSizes[size]}em`
	}

	return (
		<span className={cn(`${prefix}contemberLogo`, logotype && 'view-logotype')} style={{ fontSize }}>
			<span className={`${prefix}contemberLogo-image`} />
		</span>
	)
}
ContemberLogo.displayName = 'ContemberLogo'

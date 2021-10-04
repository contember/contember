import type { ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { ContemberLogo } from './ContemberLogo'

export interface LogoProps {
	children?: ReactNode
}
export function Logotype({ children }: LogoProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}logotype`}>
			<div className={`${prefix}logotype-symbol`}>
				<ContemberLogo size="large" logotype={!children} />
			</div>
			{children && <div className={`${prefix}logotype-label`}>{children}</div>}
		</div>
	)
}
Logotype.displayName = 'Logotype'

import { LogoutLinkInnerProps } from '@contember/admin'
import { useCallback } from 'react'

export function AlertLogoutLink({ children, onClick, ...rest }: LogoutLinkInnerProps) {
	return (
		<a href="#" onClick={useCallback(() => {
			if (confirm('Do you really want to logout?')) {
				onClick?.()
			}
		}, [onClick])}>
			{children}
		</a>
	)
}

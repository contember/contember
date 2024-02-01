import { ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useLogout } from '../hooks'

export const LogoutTrigger = ({ children }: {
	children: ReactNode
}) => {
	const logout = useLogout()
	return <Slot onClick={useCallback(() => logout(), [logout])}>{children}</Slot>
}

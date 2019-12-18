import * as React from 'react'
import { useAuthIdentity } from './useAuthIdentity'

export const useAuthToken = () => {
	const auth = useAuthIdentity()
	return React.useMemo(() => (auth ? auth.token : undefined), [auth])
}

import { useIdentityMethods } from '../contexts.js'
import { useLogoutInternal } from '../internal/hooks/useLogoutInternal.js'

export const useLogout = () => {
	const { clearIdentity } = useIdentityMethods()
	return useLogoutInternal(clearIdentity)
}

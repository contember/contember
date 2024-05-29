import { useIdentityMethods } from '../contexts'
import { useLogoutInternal } from '../internal/hooks/useLogoutInternal'

export const useLogout = () => {
	const { clearIdentity } = useIdentityMethods()
	return useLogoutInternal(clearIdentity)
}

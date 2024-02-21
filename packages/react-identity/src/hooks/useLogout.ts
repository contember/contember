import { useIdentityMethods } from '../internal/contexts'
import { useLogoutInternal } from '../internal/hooks/useLogoutInternal'

export const useLogout = () => {
	const { clearIdentity } = useIdentityMethods()
	return useLogoutInternal(clearIdentity)
}

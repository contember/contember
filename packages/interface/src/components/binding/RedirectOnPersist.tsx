import { useEntityPersistSuccess } from '@contember/react-binding'
import { useRedirect } from '@contember/react-routing'
import { RoutingLinkTarget } from '@contember/react-routing'

export const RedirectOnPersist = ({ to }: { to: RoutingLinkTarget }) => {
	const redirect = useRedirect()
	useEntityPersistSuccess((getEntity, options) => {
		if (options.successType !== 'justSuccess') {
			return
		}
		redirect(to)
	})
	return null
}

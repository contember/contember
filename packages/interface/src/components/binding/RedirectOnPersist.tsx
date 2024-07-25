import { useEntityPersistSuccess } from '@contember/react-binding'
import { RequestParameters, useRedirect } from '@contember/react-routing'
import { RoutingLinkTarget } from '@contember/react-routing'

export const RedirectOnPersist = ({ to, parameters }: { to: RoutingLinkTarget; parameters?: RequestParameters }) => {
	const redirect = useRedirect()
	useEntityPersistSuccess((getEntity, options) => {
		if (options.successType !== 'justSuccess') {
			return
		}
		redirect(to, parameters)
	})
	return null
}

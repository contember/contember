import { Component, useEntityPersistSuccess } from '@contember/react-binding'
import { RequestParameters, RoutingLinkFields, RoutingLinkTarget, useRedirect } from '@contember/react-routing'

export interface RedirectOnPersistProps {
	to: RoutingLinkTarget
	parameters?: RequestParameters
}

/**
 * Redirects to the given target after a successful persist. Exposes a static
 * render so the fields referenced by the routing target are registered during
 * the static analysis pass, just like `Link`.
 */
export const RedirectOnPersist = Component<RedirectOnPersistProps>(
	({ to, parameters }) => {
		const redirect = useRedirect()
		useEntityPersistSuccess((getEntity, options) => {
			if (options.successType !== 'justSuccess') {
				return
			}
			redirect(to, parameters)
		})
		return null
	},
	props => <RoutingLinkFields to={props.to} />,
	'RedirectOnPersist',
)

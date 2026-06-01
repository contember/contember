import { Component, Field } from '@contember/react-binding'
import { RoutingLinkTarget } from '../types/index.js'
import { parseLinkTarget } from '../internal/utils/parseLinkTarget.js'
import { createFieldsFromTarget } from '../internal/utils/createFieldsFromTarget.js'

export interface RoutingLinkFieldsProps {
	to: RoutingLinkTarget
}

/**
 * Registers the entity fields referenced by a routing target during the static
 * analysis pass, so that components which navigate on render (e.g. {@link Link}
 * or `RedirectOnPersist`) have their data needs captured in the marker tree.
 *
 * @group Routing
 */
export const RoutingLinkFields = Component<RoutingLinkFieldsProps>(
	() => null,
	(props, env) => {
		const to = parseLinkTarget(props.to, env)

		return (
			<>
				{createFieldsFromTarget(to).map((it, index) => <Field key={`${index}-${it}`} field={it} />)}
			</>
		)
	},
	'RoutingLinkFields',
)

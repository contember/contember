import {
	AutoForm,
	DataBindingProvider,
	EntityId,
	FeedbackRenderer,
	Heading,
	LayoutRenderer,
	LinkButton,
	PersistButton,
	RoutingParameter,
	useCurrentRequest,
	useOnPersistSuccess,
} from '@contember/admin'
import { createStudioLinkComponent } from '../components/StudioEntityLink'

export default function StudioForm() {
	const request = useCurrentRequest()!
	const project = request.parameters.project as string
	const entity = request.parameters.entity as string
	const id = request.parameters.id as EntityId | undefined
	const title = id ? `Edit ${entity}` : `Create ${entity}`

	const redirectOnSuccess = { pageName: 'studioForm', parameters: { project, entity, id: new RoutingParameter('entity.id') } }
	const onCreateSuccess = useOnPersistSuccess({ redirectOnSuccess })
	const LinkComponent = createStudioLinkComponent(project)

	const actions = (
		<>
			<LinkButton to={{ pageName: 'studioGrid', parameters: { project, entity } }}>Back to Grid</LinkButton>
			<PersistButton />
		</>
	)

	return (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<LayoutRenderer title={<Heading depth={1}>{title}</Heading>} actions={actions}>
				<AutoForm entity={entity} id={id} onCreateSuccess={onCreateSuccess} LinkComponent={LinkComponent} />
			</LayoutRenderer>
		</DataBindingProvider>
	)
}

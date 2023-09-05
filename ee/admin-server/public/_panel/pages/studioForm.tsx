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

export default function StudioForm() {
	const request = useCurrentRequest()!
	const project = request.parameters.project as string
	const entity = request.parameters.entity as string
	const id = request.parameters.id as EntityId | undefined
	const title = id ? `Edit ${entity}` : `Create ${entity}`

	const redirectOnSuccess = { pageName: 'studioForm', parameters: { project, entity, id: new RoutingParameter('entity.id') } }
	const onCreateSuccess = useOnPersistSuccess({ redirectOnSuccess })
	const createEditLink = (entity: string) => ({ pageName: 'studioForm', parameters: { project, entity, id: new RoutingParameter('entity.id') } })

	const actions = (
		<>
			<LinkButton to={{ pageName: 'studioGrid', parameters: { project, entity } }}>Back to Grid</LinkButton>
			<PersistButton />
		</>
	)

	return (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<LayoutRenderer title={<Heading depth={1}>{title}</Heading>} actions={actions}>
				<AutoForm entity={entity} id={id} onCreateSuccess={onCreateSuccess} createEditLink={createEditLink} />
			</LayoutRenderer>
		</DataBindingProvider>
	)
}

import {
	AutoGrid,
	DataBindingProvider,
	EntityId,
	FeedbackRenderer,
	LayoutRenderer,
	LinkButton,
	PersistButton,
	RoutingParameter,
	useCurrentRequest,
} from '@contember/admin'

export default function StudioGrid() {
	const request = useCurrentRequest()!
	const project = request.parameters.project as string
	const entity = request.parameters.entity as string
	const id = request.parameters.id as EntityId | undefined

	const createViewLinkTarget = (entity: string) => ({ pageName: 'studioGrid', parameters: { project, entity, id: new RoutingParameter('entity.id') } })
	const createEditLinkTarget = (entity: string) => ({ pageName: 'studioForm', parameters: { project, entity, id: new RoutingParameter('entity.id') } })

	const actions = (
		<>
			<LinkButton to={{ pageName: 'studioForm', parameters: { project, entity } }}>Create</LinkButton>
			<PersistButton />
		</>
	)

	const entities = {
		entityName: entity,
		filter: id === undefined ? {} : { id: { eq: id } },
	}

	return (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<LayoutRenderer title={`List ${entity}`} actions={actions} pageContentLayout="start">
				<AutoGrid entities={entities} createViewLinkTarget={createViewLinkTarget} createEditLinkTarget={createEditLinkTarget} />
			</LayoutRenderer>
		</DataBindingProvider>
	)
}

import {
	AutoForm,
	AutoGrid,
	DataBindingProvider,
	EntityId,
	FeedbackRenderer,
	LayoutRenderer,
	Link,
	LinkButton,
	PersistButton,
	RoutingParameter,
	useCurrentRequest,
	useEnvironment,
	useOnPersistSuccess,
} from '@contember/admin'

const AutoGridList = () => {
	const env = useEnvironment()
	const schema = env.getSchema()
	const entities = schema.getEntityNames().sort()

	return (
		<>
			{entities.map(entity => (
				<Link key={entity} to={{ pageName: 'auto/grid', parameters: { entity } }}>{entity}</Link>
			))}
		</>
	)
}

export default (
	<DataBindingProvider stateComponent={FeedbackRenderer}>
		<LayoutRenderer title={`Auto Admin`}>
			<AutoGridList />
		</LayoutRenderer>
	</DataBindingProvider>
)

export function Grid() {
	const request = useCurrentRequest()!
	const entity = request.parameters.entity as string
	const filter = request.parameters.id ? `[id = '${request.parameters.id}']` : ''

	const createViewLinkTarget = (entity: string) => ({ pageName: 'auto/grid', parameters: { entity, id: new RoutingParameter('entity.id') } })
	const createEditLinkTarget = (entity: string) => ({ pageName: 'auto/form', parameters: { entity, id: new RoutingParameter('entity.id') } })

	const actions = (
		<>
			<LinkButton to={{ pageName: 'auto/form', parameters: { entity } }}>Create</LinkButton>
			<PersistButton />
		</>
	)

	return (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<LayoutRenderer title={`List ${entity}`} actions={actions} pageContentLayout="start">
				<AutoGrid entities={entity + filter} createViewLinkTarget={createViewLinkTarget} createEditLinkTarget={createEditLinkTarget} />
			</LayoutRenderer>
		</DataBindingProvider>
	)
}

export function Form() {
	const request = useCurrentRequest()!
	const entity = request.parameters.entity as string
	const id = request.parameters.id as EntityId | undefined
	const title = id ? `Edit ${entity}` : `Create ${entity}`

	const redirectOnSuccess = { pageName: 'auto/form', parameters: { entity, id: new RoutingParameter('entity.id') } }
	const onCreateSuccess = useOnPersistSuccess({ redirectOnSuccess })
	const createEditLink = (entity: string) => ({ pageName: 'auto/form', parameters: { entity, id: new RoutingParameter('entity.id') } })

	const actions = (
		<>
			<LinkButton to={{ pageName: 'auto/grid', parameters: { entity } }}>Back to Grid</LinkButton>
			<PersistButton />
		</>
	)

	return (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<LayoutRenderer title={title} actions={actions}>
				<AutoForm entity={entity} id={id} onCreateSuccess={onCreateSuccess} createEditLink={createEditLink} />
			</LayoutRenderer>
		</DataBindingProvider>
	)
}

import {
	AutoForm,
	AutoGrid,
	DataBindingProvider,
	EntityId,
	FeedbackRenderer,
	Link,
	LinkButton,
	NavigateBackLink,
	PersistButton,
	RoutingParameter,
	useCurrentRequest,
	useEnvironment,
	useOnPersistSuccess,
} from '@contember/admin'
import { Directive, Title } from '../components/Directives'
import { Slots } from '../components/Slots'

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
	<>
		<Title>Auto Admin</Title>
		<Slots.ContentStack>
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<AutoGridList />
			</DataBindingProvider>
		</Slots.ContentStack>
	</>
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
			<Directive name="layout" content="default" />

			<Slots.Back>
				<NavigateBackLink to={{ pageName: 'auto' }}>Back to Auto</NavigateBackLink>
			</Slots.Back>

			<Title>{`List ${entity}`}</Title>

			<Slots.Actions>{actions}</Slots.Actions>
			<Slots.ContentStack>
				<AutoGrid entities={entity + filter} createViewLinkTarget={createViewLinkTarget} createEditLinkTarget={createEditLinkTarget} />
			</Slots.ContentStack>
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

	return (
		<>
			<Title>{title}</Title>
			<Slots.Back>
				<NavigateBackLink to={{ pageName: 'auto/grid', parameters: { entity } }}>Back to Grid</NavigateBackLink>
			</Slots.Back>

			<Slots.ContentStack>
				<DataBindingProvider stateComponent={FeedbackRenderer} >
					<Slots.Actions>
						<PersistButton />
					</Slots.Actions>
					<AutoForm entity={entity} id={id} onCreateSuccess={onCreateSuccess} createEditLink={createEditLink} />
				</DataBindingProvider>
			</Slots.ContentStack>
		</>
	)
}

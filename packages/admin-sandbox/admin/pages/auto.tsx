import {
	AutoForm,
	AutoGrid,
	DataBindingProvider,
	EntityId,
	FeedbackRenderer,
	Link,
	LinkButton,
	PersistButton,
	RoutingParameter,
	useCurrentRequest,
	useEnvironment,
	useOnPersistSuccess,
} from '@contember/admin'
import { NavigateBackLink } from '@contember/cms-layout'
import { Actions, Back, ContentStack, Title } from '../components/Layout'
import { MetaDirective } from '../components/MetaDirectives'

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
		<ContentStack>
			<DataBindingProvider stateComponent={FeedbackRenderer}>
				<AutoGridList />
			</DataBindingProvider>
		</ContentStack>
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
			<MetaDirective name="layout" content="legacy" />

			<Back>
				<NavigateBackLink to={{ pageName: 'auto' }}>Back to Auto</NavigateBackLink>
			</Back>

			<Title>{`List ${entity}`}</Title>

			<Actions>{actions}</Actions>
			<ContentStack>
				<AutoGrid entities={entity + filter} createViewLinkTarget={createViewLinkTarget} createEditLinkTarget={createEditLinkTarget} />
			</ContentStack>
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
			<Back>
				<NavigateBackLink to={{ pageName: 'auto/grid', parameters: { entity } }}>Back to Grid</NavigateBackLink>
			</Back>

			<Actions>
				<PersistButton />
			</Actions>

			<ContentStack>
				<DataBindingProvider stateComponent={FeedbackRenderer} >
					<AutoForm entity={entity} id={id} onCreateSuccess={onCreateSuccess} createEditLink={createEditLink} />
				</DataBindingProvider>
			</ContentStack>
		</>
	)
}

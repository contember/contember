import {
	AutoGrid,
	DataBindingProvider,
	EntityId,
	FeedbackRenderer,
	Heading,
	LayoutRenderer,
	LinkButton,
	PersistButton,
	RoutingParameter,
	SugaredFilter,
	useCurrentRequest,
} from '@contember/admin'
import { createStudioLinkComponent } from '../components/StudioEntityLink'

export default function StudioGrid() {
	const request = useCurrentRequest()!
	const project = request.parameters.project as string
	const entity = request.parameters.entity as string
	const id = request.parameters.id as EntityId | undefined

	const LinkComponent = createStudioLinkComponent(project)

	const actions = (
		<>
			<LinkButton to={{ pageName: 'studioForm', parameters: { project, entity } }}>Create</LinkButton>
			<PersistButton />
		</>
	)

	const filter: SugaredFilter = id === undefined ? {} : { id: { eq: id } }
	const entities = {
		entityName: entity,
		filter,
	}

	return (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<LayoutRenderer title={<Heading depth={1}>List {entity}</Heading>} actions={actions} pageContentLayout="stretch">
				<AutoGrid entities={entities} LinkComponent={LinkComponent} />
			</LayoutRenderer>
		</DataBindingProvider>
	)
}

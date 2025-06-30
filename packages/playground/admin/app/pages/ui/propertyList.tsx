import { BrushIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { GenericPage } from '~/lib/pages'
import { PropertyItem, PropertyList } from '~/lib/ui/property-list'

export default () => (
	<GenericPage title={<Title icon={<BrushIcon />}>Property list</Title>}>
		<PropertyList>
			<PropertyItem label="Name">
				John Doe
			</PropertyItem>
			<PropertyItem label="Job type">
				Full-time
			</PropertyItem>
			<PropertyItem label="Workplace">
				Office
			</PropertyItem>
		</PropertyList>
	</GenericPage>
)

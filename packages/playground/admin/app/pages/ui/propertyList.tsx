import { BrushIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Slots } from '~/lib/layout'
import { PropertyItem, PropertyList } from '~/lib/ui/property-list'

export default () => (
	<>
		<Slots.Title>
			<Title icon={<BrushIcon />}>Property list</Title>
		</Slots.Title>

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
	</>
)

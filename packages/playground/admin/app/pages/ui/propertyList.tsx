import { PropertyItem, PropertyList } from '@app/lib/ui/property-list'

export default () => {
	return (<>
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
	</>)
}

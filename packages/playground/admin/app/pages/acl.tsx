import { Component, EntityListSubTree, Field } from '@contember/interface'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/lib/ui/table'
import { formatBoolean } from '~/lib/formatting'
import { useEntity } from '@contember/react-binding'
import { Binding } from '~/lib/binding'
import { InputField } from '~/lib/form'

export default () => {
	return (
		<Binding>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>canRead</TableHead>
						{/*<TableHead>canReadSecondary</TableHead>*/}
						<TableHead>canEdit</TableHead>
						{/*<TableHead>primaryValue</TableHead>*/}
						{/*<TableHead>secondaryValue</TableHead>*/}
						<TableHead>input</TableHead>
					</TableRow>

				</TableHeader>
				<TableBody>
					<EntityListSubTree entities="AclRestrictedValue">
						<TableRow>
							<TableCell>
								<Field field="canRead" format={formatBoolean}/>
							</TableCell>
							{/*<TableCell>*/}
							{/*	<Field field="canReadSecondary" format={formatBoolean}/>*/}
							{/*</TableCell>*/}
							<TableCell>
								<Field field="canEdit" format={formatBoolean}/>
							</TableCell>
							{/*<TableCell>*/}
							{/*	<Field field="primaryValue"/><br/>*/}
							{/*	<MetaView field="primaryValue"/>*/}
							{/*</TableCell>*/}
							{/*<TableCell>*/}
							{/*	<Field field="secondaryValue"/><br />*/}
							{/*	<MetaView field="secondaryValue"/>*/}
							{/*</TableCell>*/}
							<TableCell>
								<AclAwareInputField field="primaryValue" />
							</TableCell>
						</TableRow>
					</EntityListSubTree>
				</TableBody>
			</Table>
		</Binding>
	)
}


export const MetaView = Component<{field: string}>(({ field }) => {
	const entity = useEntity()

	return <>
		R: {formatBoolean(entity.getFieldMeta(field).readable ?? null) ?? '?'}{' '}
		U: {formatBoolean(entity.getFieldMeta(field).updatable ?? null) ?? '?'}
	</>

}, ({ field }) => {
	return <Field field={field} withMeta={['readable', 'updatable']} />
})


export const AclAwareInputField = Component<{field: string}>(({ field }) => {
	const entity = useEntity()
	if (entity.getFieldMeta(field).readable === false) {
		return 'unavailable'
	}

	return <InputField field={field} inputProps={{
		readOnly: entity.getFieldMeta(field).updatable === false,
	}} />

}, ({ field }) => {
	return <>
		<Field field={field} withMeta={['readable', 'updatable']} />
	</>
})

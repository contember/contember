import { Stack, TabButton } from '@contember/ui'
import { ReactNode, useState } from 'react'
import { ResolvedFileSelectionInnerProps } from './SelectFileDialog'
import { SingleKindSelectFileDialog, SingleKindSelectFileDialogExtraProps } from './SingleKindSelectFileDialog'

export type DiscriminatedSelectFileDialogComponent = (SingleKindSelectFileDialogExtraProps<any> & { label: ReactNode })

export type DiscriminatedSelectFileDialogExtraProps = {
	components: DiscriminatedSelectFileDialogComponent[]
}
export type DiscriminatedSelectFileDialogProps =
	& ResolvedFileSelectionInnerProps
	& DiscriminatedSelectFileDialogExtraProps

export const DiscriminatedSelectFileDialog = (
	{
		components,
		selectedEntityIds,
		onToggleSelectConnector,
	}: DiscriminatedSelectFileDialogProps,
) => {
	const [component, setComponent] = useState(components[0])

	return <>
		{components.length > 1 && <Stack direction={'horizontal'}>
			{components.map((it, index) => (
				<TabButton
					key={index}
					onClick={() => setComponent(it)}
					isSelected={it === component}
				>
					{it.label}
				</TabButton>
			))}
		</Stack>}
		<SingleKindSelectFileDialog
			onToggleSelectConnector={onToggleSelectConnector}
			selectedEntityIds={selectedEntityIds}
			{...component}
		/>
	</>
}

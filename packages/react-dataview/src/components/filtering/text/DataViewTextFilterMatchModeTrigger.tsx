import * as React from 'react'
import { ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { TextFilterArtifactsMatchMode } from '../../../filterTypes'
import { dataAttribute } from '@contember/utilities'
import { useDataViewTextFilterMatchMode } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

export type DataViewTextFilterMatchModeTriggerProps = {
	name?: string
	children: ReactElement
	mode: TextFilterArtifactsMatchMode
}

export const DataViewTextFilterMatchModeTrigger = ({ name, children, mode }: DataViewTextFilterMatchModeTriggerProps) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [active, cb] = useDataViewTextFilterMatchMode(name, mode)
	return <Slot onClick={cb} data-active={dataAttribute(active)}>{children}</Slot>
}

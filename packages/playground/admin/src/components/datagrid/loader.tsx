import * as React from 'react'
import { Loader } from '../ui/loader'

export const DataViewLoaderOverlay = () => (
	<Loader position={'absolute'} />
)

export const DataViewInitialLoader = () => (
	<Loader position={'static'} />
)

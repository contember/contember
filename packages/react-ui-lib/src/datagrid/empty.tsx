import * as React from 'react'
import { dict } from '@contember/react-ui-lib-base'

export const DataGridNoResults = () => (
	<div className={'p-4 text-lg rounded-md border border-gray-200'}>
		{dict.datagrid.empty}
	</div>
)

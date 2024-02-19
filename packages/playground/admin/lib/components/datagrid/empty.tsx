import * as React from 'react'
import { dict } from '../../../lib/dict'

export const DataViewNoResults = () => (
	<div className={'p-4 text-lg rounded-md border'}>
		{dict.datagrid.empty}
	</div>
)

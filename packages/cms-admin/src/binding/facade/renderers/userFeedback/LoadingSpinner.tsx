import * as React from 'react'
import { Spinner } from '@contember/ui'

export const LoadingSpinner = React.memo(() => (
	<div className="loadingSpinner">
		<Spinner />
	</div>
))

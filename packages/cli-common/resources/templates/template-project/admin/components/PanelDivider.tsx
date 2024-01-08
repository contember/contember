import { LayoutPrimitives } from '@contember/layout'
import { Divider } from '@contember/ui'
import { memo } from 'react'

export const PanelDivider = memo<{ name: string }>(({ name }) => (
	<LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>{({ panels }) => {
		const panel = panels.get(name)

		return panel?.behavior === 'static' && panel?.visibility === 'visible' && (
			<Divider />
		)
	}}</LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>
))
PanelDivider.displayName = 'PanelDivider'

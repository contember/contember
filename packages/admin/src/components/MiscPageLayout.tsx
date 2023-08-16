import { Box, BoxOwnProps, Heading, Layout, Spacer, Stack } from '@contember/ui'
import { ReactNode, memo } from 'react'

export type MiscPageLayoutProps =
	& Omit<BoxOwnProps, 'header' | 'footer'>
	& {
		footerActions?: ReactNode
		heading?: ReactNode
	}

export const MiscPageLayout = memo<MiscPageLayoutProps>(({ footerActions, heading, children, ...props }) => (
	<Layout>
		<div className="centerCard">
			<div className="centerCard-in">
				<Box
					gap="large"
					label={heading && (typeof heading === 'string'
						? <Heading depth={1} size="small">{heading}</Heading>
						: heading
					)}
					{...props}
				>
					<Stack gap="large">
						{children}
					</Stack>
				</Box>
				{footerActions && <div style={{ position: 'sticky', bottom: 0 }}>
					<Spacer gap="large" />
					<Stack horizontal>
						{footerActions}
					</Stack>
				</div>}
			</div>
		</div>
	</Layout>
))
MiscPageLayout.displayName = 'MiscPageLayout'

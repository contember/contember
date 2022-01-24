import { Aether, Box, BoxOwnProps, Heading, Stack } from '@contember/ui'
import { memo } from 'react'

export interface MiscPageLayoutProps extends BoxOwnProps {}

export const MiscPageLayout = memo<MiscPageLayoutProps>(({ heading, children, ...props }) => (
	<Aether>
		<div className="centerCard">
			<div className="centerCard-in">
				<Box {...props}>
					<Stack direction="vertical" gap="large">
						{heading && (typeof heading === 'string'
							? <Heading size="small" depth={1}>{heading}</Heading>
							: heading
						)}
						{children}
					</Stack>
				</Box>
			</div>
		</div>
	</Aether>
))
MiscPageLayout.displayName = 'MiscPageLayout'

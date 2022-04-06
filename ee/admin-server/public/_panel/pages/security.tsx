import { Box, ChangePassword, Divider, Heading, LayoutPage, OtpManagement, Stack } from '@contember/admin'

export default () => (
	<LayoutPage title="Profile security">
		<Stack direction="vertical" gap="xlarge">
			<ChangePassword />

			<Divider />

			<Heading depth={3}>Two-factor authentication</Heading>
			<Box>
				<OtpManagement />
			</Box>
		</Stack>
	</LayoutPage>
)

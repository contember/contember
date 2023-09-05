import { Box, ChangePassword, Divider, Heading, LayoutPage, OtpManagement, Stack } from '@contember/admin'

export default () => (
	<LayoutPage title={<Heading depth={1}>Profile security</Heading>}>
		<Stack gap="large">
			<ChangePassword />

			<Divider />

			<Heading depth={3}>Two-factor authentication</Heading>
			<Box>
				<OtpManagement />
			</Box>
		</Stack>
	</LayoutPage>
)

import { MiscPageLayout } from '../MiscPageLayout'
import { AnchorButton, Button, Icon } from '@contember/ui'
import { ProjectListButtons, ProjectListProps } from '../Project'
import { FC } from 'react'
import { useLogout } from '../Identity'

export interface LoginProjectsProps extends ProjectListProps {
}

export const LoginProjects: FC<LoginProjectsProps> = props => {
	const logout = useLogout()

	return (
		<MiscPageLayout
			heading="Projects"
			actions={<>
				<AnchorButton href={'/_panel/'} size={'small'} distinction={'seamless'}><Icon blueprintIcon={'cog'} /></AnchorButton>
				<Button onClick={logout} size={'small'} distinction={'seamless'}><Icon blueprintIcon={'log-out'} /></Button>
			</>}
		>
			<ProjectListButtons {...props} />
		</MiscPageLayout>
	)
}

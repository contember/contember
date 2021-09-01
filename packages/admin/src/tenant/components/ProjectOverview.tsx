import { FC } from 'react'
import { UsersList } from './UsersList'

export const ProjectOverview: FC<{project: string}> = ({ project }) => {
	return <UsersList
		project={project}
		createInviteUserLink={() => 'foo'}
		createEditUserLink={() => 'bar'}
	/>
}

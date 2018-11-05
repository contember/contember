import { Card, H1 } from '@blueprintjs/core'
import * as React from 'react'
import { ProjectConfig } from '../state/projectsConfigs'
import Link from './Link'

interface ProjectsListProps {
	configs: ProjectConfig[]
}

export default class ProjectsList extends React.Component<ProjectsListProps, {}> {
	render() {
		return (
			<div className="centerCard-wrap">
				<Card className="centerCard">
					<H1>Projects</H1>
					<div>
						{this.props.configs.map((config, i) => (
							<Link
								key={i}
								requestChange={() => ({
									name: 'project_page',
									project: config.project,
									stage: config.stage,
									pageName: 'dashboard',
									parameters: {},
									dimensions: {}
								})}
								Component={props => (
									<a {...props} className="projectsList-item">
										{config.project}/{config.stage}
									</a>
								)}
							/>
						))}
					</div>
				</Card>
			</div>
		)
	}
}

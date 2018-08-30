import * as React from 'react'
import { StageConfig } from './Admin'
import { H1, Card } from '@blueprintjs/core'
import Link from './Link'

interface ProjectsListProps {
	configs: StageConfig[]
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
									parameters: {}
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

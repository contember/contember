import { Schema } from '@contember/schema'
import { h } from 'preact'
import { collectReferences } from '../../schema/collectReferences'
import { EntityLink } from './EntityLink'
import { EntityInfo } from './EntityInfo'


export const ProjectInfo = (props: { schema: Schema; projectName: string }) => {
	const references = collectReferences(props.schema.model)

	return (
		<div class={'w-full'}>
			<div class={'bg-gray-100 p-6 border-b border-gray-400'}>
				<h1 class={'font-bold text-xl mb-1'}>{props.projectName}</h1>
				<div class={'flex flex-column gap-4'}>
					<div>
						<h2 class={'font-semibold text-gray-500 mb-1'}>Entities</h2>
						<ul class={'text-sm'}>
							{Object.values(props.schema.model.entities).map(entity => (
								<li>
									<EntityLink entity={entity.name} />
								</li>
							))}
						</ul>
					</div>
					<div>
						<h2 class={'font-semibold text-gray-500 mb-1'}>Enums</h2>
						<ul class={'text-sm'}>
							{Object.entries(props.schema.model.enums).map(([name, _enum]) => (
								<li class={'mb-2'}>
									{name} <br />
									<span class={'text-gray-700 ml-4'}>
										{_enum.values.join(', ')}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>


			</div>
			{Object.values(props.schema.model.entities).map(entity => (
				<EntityInfo entity={entity} schema={props.schema} references={references}/>
			))}
		</div>
	)
}

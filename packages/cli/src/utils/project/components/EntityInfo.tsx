import { Model, Schema } from '@contember/schema'
import { ReferencesMap } from '../../schema/collectReferences'
import { formatEntityAnchor, formatFieldAnchor } from './utils'
import { SinglePermission } from './SinglePermission'
import { FieldType } from './FieldType'
import { FieldPermissions } from './FieldPermissions'
import { OnDelete } from './OnDelete'
import { Fragment, h } from 'preact'

interface EntityInfoProps {
	entity: Model.Entity
	schema: Schema
	references: ReferencesMap
}

export const EntityInfo = ({ entity, schema, references }: EntityInfoProps) => (
	<div class={'m-4 border border-gray-400 rounded-lg target:border-red-400 target:border-2'}
		 id={formatEntityAnchor(entity.name)}>
		<div class={'font-bold text-gray-900 py-2 px-4 border-b border-gray-400'}>
			{entity.name}
		</div>
		<div class={'px-2 py-2 flex flex-wrap '}>
			<div>
				<table>
					<thead>
						<tr>
							<th class={'text-left px-2 text-gray-500 font-normal w-[180px] max-w-[180px]'}>Name</th>
							<th class={'text-left px-2 text-gray-500 font-normal w-[340px] max-w-[340px]'}>Type</th>
							{Object.keys(schema.acl.roles).map(role => <th
								class={'text-left px-2 text-gray-500 font-normal w-[120px] max-w-[120px] text-xs truncate text-sm'}>{role}</th>)}
						</tr>
					</thead>
					<tr>
						<td></td>
						<td></td>
						{Object.values(schema.acl.roles).map(role => <td class={'px-2'}>
							<SinglePermission value={'D'}
											  predicate={role.entities[entity.name]?.operations.delete} />
						</td>)}
					</tr>
					{Object.values(entity.fields).map(field => (
						<tr class={'even:bg-gray-100 target:border-2 border-red-400'}
							id={formatFieldAnchor(entity.name, field.name)}>
							<td class={'px-2 font-mono truncate  w-[180px] max-w-[180px]'} title={field.name}>
								{field.name}
							</td>
							<td class={'text-gray-800 px-2 font-mono w-[420px] max-w-[420px]'}>
								<FieldType field={field} />
							</td>
							{Object.values(schema.acl.roles).map(role => <td class={'px-2'}>
								<FieldPermissions field={field.name}
												  entityPermissions={role.entities[entity.name]} />
							</td>)}
						</tr>
					))}

				</table>
			</div>
			<div class={'px-2 py-2 w-1/2'}>
				<h3 class={'text-lg text-gray-600'}>On delete behaviour:</h3>
				<p class={'text-gray-500 text-sm'}>
					(What happens when you attempt to delete entity {entity.name})</p>
				<div class={'mt-2 text-sm '}>
					<OnDelete references={references} entity={entity} visited={[]} />
				</div>
			</div>
			{false && <div class={'px-2 py-2 w-1/2'}>
				<h3 class={'text-lg text-gray-600'}>ACL predicates:</h3>
				<div class={'mt-2 text-sm '}>
					{Object.entries(schema.acl.roles).map(([roleName, role]) =>
						Object.entries(role.entities[entity.name]?.predicates ?? {}).map(([predicateName, predicate]) => (
							<Fragment>
								<h4>{roleName}: {predicateName}</h4>
								<code>{JSON.stringify(predicate)}</code>
							</Fragment>
						)),
					)}
				</div>
			</div>}
		</div>
	</div>
)

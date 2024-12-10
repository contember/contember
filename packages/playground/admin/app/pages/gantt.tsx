import { DefaultGanttChart } from '@app/lib-extra/gantt/default'
import { Binding } from '@app/lib/binding'
import { InputField, SelectField } from '@app/lib/form'
import { Component, Field } from '@contember/interface'

export default () => (
	<>
		<Binding>
			<DefaultGanttChart
				entities="GanttActivity"
				discriminationEntity="GanttDiscriminator"
				discriminationField="discriminator"
				startTimeField="startTime"
				endTimeField="endTime"
				startTime="10:00"
				endTime="18:00"
				discriminationLabel={<Field field="name" />}
				activityLabel={<><Field field="name" /> (<Field field="category.name" />)</>}
				createActivityForm={<ActivityForm />}
				editActivityForm={<ActivityForm />}
				// initial filter to show date with mock data
				initialFilters={() => {
					const r = {
						startTime: {
							start: '2024-11-19',
						},
					}
					return r
				}}
			/>
		</Binding>
	</>
)

const ActivityForm = Component(() => (
	<>
		<InputField field="name" label="Name" />
		<SelectField field="category" label="Category">
			<Field field="name" />
		</SelectField>
	</>
))

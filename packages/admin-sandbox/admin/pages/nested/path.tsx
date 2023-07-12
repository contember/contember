import { Section, SectionTabs, SectionTabsProvider, SelectFieldInner } from '@contember/admin'
import { ContentSlotSources, HeaderSlotSources } from '@contember/layout'
import { Directive } from '../../components/Directives'
import { SlotSources, Title } from '../../components/Slots'

export default function InnerFooPage() {
	return (
		<SectionTabsProvider>
			<Title>Nested Path</Title>
			<ContentSlotSources.ContentHeader>
				<SectionTabs />
			</ContentSlotSources.ContentHeader>

			<Directive name="content-max-width" content={720} />

			<SlotSources.Actions>
				<SelectFieldInner
					menuZIndex={2}
					errors={undefined}
					currentValue={null}
					onSelect={() => { }}
					onClear={() => { }}
					data={[
						{ label: 'Option 1', value: '1', key: '1', searchKeywords: '1' },
						{ label: 'Option 2', value: '2', key: '2', searchKeywords: '2' },
						{ label: 'Option 3', value: '3', key: '3', searchKeywords: '3' },
						{ label: 'Option 4', value: '4', key: '4', searchKeywords: '4' },
						{ label: 'Option 5', value: '5', key: '5', searchKeywords: '5' },
					]}
					label="Select:"
					labelPosition="labelInlineLeft"
				/>
			</SlotSources.Actions>

			<h2>Hello from Inner Foo</h2>
			<Section heading="Lorem" showTab={false}>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce arcu est, dignissim at varius vitae, egestas at enim. Cras at malesuada lacus. Sed pellentesque odio in sem malesuada, et feugiat tortor rutrum. Duis vel consectetur mi, sed vulputate quam. Suspendisse elementum sapien nec erat finibus rhoncus. Phasellus et enim et ante hendrerit tempor. In id venenatis felis. Nunc sed orci eu lectus euismod efficitur ornare at nisi. Sed egestas, eros eu dictum porta, enim nunc elementum nisl, et mollis dolor orci a tellus. Suspendisse potenti. Nunc sollicitudin id leo vitae aliquam. Nam efficitur nulla id tristique pulvinar. Nulla a efficitur ipsum, sit amet varius mi. Proin pulvinar dapibus tristique.
				</p>
			</Section>

			<Section heading="Integer">
				<p>
					Integer fermentum diam sed erat dictum, nec efficitur diam convallis. Duis sodales, tellus eget interdum lobortis, ex enim convallis ante, eget posuere purus leo quis mauris. Suspendisse iaculis, libero vel semper tempus, lectus nisi sodales purus, ut placerat magna augue eu mauris. Integer non sollicitudin augue. Praesent tempus non est ut semper. Fusce euismod leo at lorem gravida ornare. Vestibulum est metus, dapibus at ligula iaculis, euismod cursus nibh. Quisque vestibulum orci tortor, facilisis lacinia lacus placerat in. Morbi ornare libero vel urna ornare viverra. Fusce ac odio in arcu vehicula rhoncus vel eu enim. Curabitur feugiat porta pulvinar. Mauris in quam eleifend, aliquet arcu eget, blandit nisi.
				</p>
			</Section>

			<Section heading="Etiam">
				<p>
					Etiam vel sapien sed leo consectetur maximus. Curabitur cursus, nisl gravida egestas porttitor, quam quam pulvinar velit, quis vulputate orci velit quis lorem. Maecenas at aliquet nibh. Proin non mi nisl. Nulla eget sapien vel nunc dapibus ornare eu luctus velit. Cras dictum maximus erat, eu sagittis eros tempus in. Quisque consectetur neque in felis luctus, a pharetra sapien aliquam. Etiam massa dui, volutpat eu faucibus sit amet, iaculis pulvinar sem. Aenean vitae hendrerit arcu. Donec nibh orci, sollicitudin quis maximus bibendum, egestas sed odio. Pellentesque vitae arcu fermentum purus accumsan convallis eget sit amet quam. Praesent elementum elementum massa, quis tempor elit porttitor congue. Fusce volutpat velit eget sapien interdum suscipit. Vestibulum ac malesuada nisi. Fusce non urna dictum, venenatis quam nec, dignissim lacus. Nulla gravida efficitur lectus, vel ultrices lacus placerat ac.
				</p>
			</Section>

			<Section heading="Donec">
				<p>
					Donec sit amet leo et massa ultricies pretium vitae tincidunt orci. Donec malesuada rhoncus iaculis. Nam sed aliquet sem. Vivamus vel congue leo. Pellentesque cursus enim quam, nec volutpat metus efficitur scelerisque. Proin sed leo ac dui commodo pulvinar ultrices eget augue. Donec sit amet mauris commodo, cursus orci non, bibendum risus. Cras a ante nisi. Suspendisse eu ligula at lacus semper posuere. Donec sodales lectus ut nisi consectetur consectetur.
				</p>
			</Section>

			<Section heading="Duis">
				<p>
					Duis eget nisi laoreet, hendrerit eros vel, molestie justo. Donec mollis orci et cursus dictum. Integer commodo posuere imperdiet. Duis eget vulputate neque, at porta tellus. Etiam vehicula euismod sem a sagittis. Fusce quis sem mattis, scelerisque est eget, posuere nunc. Aliquam erat volutpat. Quisque eget diam leo. Ut dapibus odio mi, vitae volutpat elit faucibus sed. Praesent eu faucibus dui. Quisque quis libero a sapien interdum egestas ut egestas enim. Etiam non ante orci. Etiam et condimentum sapien. Aenean fringilla urna imperdiet diam ornare dictum. Nullam at diam et est tincidunt placerat. Phasellus in magna vulputate, cursus tortor ac, laoreet massa.
				</p>
			</Section>

			<SlotSources.Sidebar>
				<p><small>Hello Contember world from the sidebar!</small></p>

				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce arcu est, dignissim at varius vitae, egestas at enim. Cras at malesuada lacus. Sed pellentesque odio in sem malesuada, et feugiat tortor rutrum. Duis vel consectetur mi, sed vulputate quam. Suspendisse elementum sapien nec erat finibus rhoncus. Phasellus et enim et ante hendrerit tempor. In id venenatis felis. Nunc sed orci eu lectus euismod efficitur ornare at nisi. Sed egestas, eros eu dictum porta, enim nunc elementum nisl, et mollis dolor orci a tellus. Suspendisse potenti. Nunc sollicitudin id leo vitae aliquam. Nam efficitur nulla id tristique pulvinar. Nulla a efficitur ipsum, sit amet varius mi. Proin pulvinar dapibus tristique.
				</p>

				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce arcu est, dignissim at varius vitae, egestas at enim. Cras at malesuada lacus. Sed pellentesque odio in sem malesuada, et feugiat tortor rutrum. Duis vel consectetur mi, sed vulputate quam. Suspendisse elementum sapien nec erat finibus rhoncus. Phasellus et enim et ante hendrerit tempor. In id venenatis felis. Nunc sed orci eu lectus euismod efficitur ornare at nisi. Sed egestas, eros eu dictum porta, enim nunc elementum nisl, et mollis dolor orci a tellus. Suspendisse potenti. Nunc sollicitudin id leo vitae aliquam. Nam efficitur nulla id tristique pulvinar. Nulla a efficitur ipsum, sit amet varius mi. Proin pulvinar dapibus tristique.
				</p>
			</SlotSources.Sidebar>
		</SectionTabsProvider>
	)
}

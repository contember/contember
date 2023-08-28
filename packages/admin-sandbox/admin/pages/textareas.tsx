import { TextareaInput } from '@contember/ui'
import { range } from '@contember/utilities'
import { SlotSources } from '../components/Slots'

const loremIpsumTexts = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce arcu est, dignissim at varius vitae, egestas at enim. Cras at malesuada lacus. Sed pellentesque odio in sem malesuada, et feugiat tortor rutrum. Duis vel consectetur mi, sed vulputate quam. Suspendisse elementum sapien nec erat finibus rhoncus. Phasellus et enim et ante hendrerit tempor. In id venenatis felis. Nunc sed orci eu lectus euismod efficitur ornare at nisi. Sed egestas, eros eu dictum porta, enim nunc elementum nisl, et mollis dolor orci a tellus. Suspendisse potenti. Nunc sollicitudin id leo vitae aliquam. Nam efficitur nulla id tristique pulvinar. Nulla a efficitur ipsum, sit amet varius mi. Proin pulvinar dapibus tristique.',
	'Integer fermentum diam sed erat dictum, nec efficitur diam convallis. Duis sodales, tellus eget interdum lobortis, ex enim convallis ante, eget posuere purus leo quis mauris. Suspendisse iaculis, libero vel semper tempus, lectus nisi sodales purus, ut placerat magna augue eu mauris. Integer non sollicitudin augue. Praesent tempus non est ut semper. Fusce euismod leo at lorem gravida ornare. Vestibulum est metus, dapibus at ligula iaculis, euismod cursus nibh. Quisque vestibulum orci tortor, facilisis lacinia lacus placerat in. Morbi ornare libero vel urna ornare viverra. Fusce ac odio in arcu vehicula rhoncus vel eu enim. Curabitur feugiat porta pulvinar. Mauris in quam eleifend, aliquet arcu eget, blandit nisi.',
	'Etiam vel sapien sed leo consectetur maximus. Curabitur cursus, nisl gravida egestas porttitor, quam quam pulvinar velit, quis vulputate orci velit quis lorem. Maecenas at aliquet nibh. Proin non mi nisl. Nulla eget sapien vel nunc dapibus ornare eu luctus velit. Cras dictum maximus erat, eu sagittis eros tempus in. Quisque consectetur neque in felis luctus, a pharetra sapien aliquam. Etiam massa dui, volutpat eu faucibus sit amet, iaculis pulvinar sem. Aenean vitae hendrerit arcu. Donec nibh orci, sollicitudin quis maximus bibendum, egestas sed odio. Pellentesque vitae arcu fermentum purus accumsan convallis eget sit amet quam. Praesent elementum elementum massa, quis tempor elit porttitor congue. Fusce volutpat velit eget sapien interdum suscipit. Vestibulum ac malesuada nisi. Fusce non urna dictum, venenatis quam nec, dignissim lacus. Nulla gravida efficitur lectus, vel ultrices lacus placerat ac.',
	'Donec sit amet leo et massa ultricies pretium vitae tincidunt orci. Donec malesuada rhoncus iaculis. Nam sed aliquet sem. Vivamus vel congue leo. Pellentesque cursus enim quam, nec volutpat metus efficitur scelerisque. Proin sed leo ac dui commodo pulvinar ultrices eget augue. Donec sit amet mauris commodo, cursus orci non, bibendum risus. Cras a ante nisi. Suspendisse eu ligula at lacus semper posuere. Donec sodales lectus ut nisi consectetur consectetur.',
	'Duis eget nisi laoreet, hendrerit eros vel, molestie justo. Donec mollis orci et cursus dictum. Integer commodo posuere imperdiet. Duis eget vulputate neque, at porta tellus. Etiam vehicula euismod sem a sagittis. Fusce quis sem mattis, scelerisque est eget, posuere nunc. Aliquam erat volutpat. Quisque eget diam leo. Ut dapibus odio mi, vitae volutpat elit faucibus sed. Praesent eu faucibus dui. Quisque quis libero a sapien interdum egestas ut egestas enim. Etiam non ante orci. Etiam et condimentum sapien. Aenean fringilla urna imperdiet diam ornare dictum. Nullam at diam et est tincidunt placerat. Phasellus in magna vulputate, cursus tortor ac, laoreet massa.',
] as const

export default () => {
	return (
		<>
			<SlotSources.Title>Textareas</SlotSources.Title>
			{range(1, 500).map(i => (
				<TextareaInput
					key={i}
					value={loremIpsumTexts[i % loremIpsumTexts.length]}
				/>
			))}
		</>
	)
}

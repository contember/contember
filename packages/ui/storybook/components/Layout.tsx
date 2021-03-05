import { storiesOf } from '@storybook/react'
import {
	Breadcrumbs,
	ContentStatus,
	DimensionSwitcher,
	Layout,
	LayoutHeading,
	SaveControl,
	SeamlessDropdown,
	Trio,
	UserMiniControl,
} from '../../src/components'

storiesOf('Layout', module)
	.add('large placeholders', () => {
		return <Layout top="top" main="main" sideBar="sideBar" actions="actions" />
	})
	.add('placeholders', () => {
		return (
			<Layout
				topStart="topStart"
				topCenter="topCenter"
				topEnd="topEnd"
				sideBarStart="sideBarStart"
				sideBarCenter="sideBarCenter"
				sideBarEnd="sideBarEnd"
				mainStart="mainStart"
				mainCenter="mainCenter"
				mainEnd="mainEnd"
				actionsStart="actionsStart"
				actionsCenter="actionsCenter"
				actionsEnd="actionsEnd"
			>
				children
			</Layout>
		)
	})
	.add('some components', () => {
		return (
			<Layout
				topStart={
					<SeamlessDropdown inline label={<LayoutHeading label="My Admin" />}>
						content
					</SeamlessDropdown>
				}
				topCenter={
					<SeamlessDropdown
						inline
						label={
							<DimensionSwitcher
								dimensions={[
									{ key: 'site', label: 'Site', options: [{ value: 'cz', label: 'CZ', active: true }] },
									{
										key: 'lang',
										label: 'Language',
										options: [
											{ value: 'cz', label: 'CZ', active: true },
											{ value: 'en', label: 'EN', active: true },
											{ value: 'de', label: 'DE', active: false },
										],
									},
								]}
							/>
						}
					>
						content
					</SeamlessDropdown>
				}
				topEnd={
					<SeamlessDropdown
						caret
						inline
						label={
							<UserMiniControl
								avatarUrl="https://i.pravatar.cc/150?img=3"
								name="Honza Sládek"
								note="Superadministrator"
							/>
						}
					>
						content
					</SeamlessDropdown>
				}
				sideBarStart={
					<div>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ut diam sed augue commodo imperdiet. Nunc
							faucibus quam eget pellentesque condimentum. Curabitur ut quam nunc. Duis volutpat ultricies commodo.
							Curabitur non risus lacinia, viverra magna sed, pulvinar velit. Curabitur a auctor purus. Aenean eget
							ultricies enim. Praesent at mauris et libero porta rutrum et eget metus. Vivamus id magna metus. Aliquam
							ex neque, vehicula a nunc vitae, gravida dictum dolor. Phasellus risus mi, auctor quis ex id, vehicula
							rutrum nibh.
						</p>

						<p>
							Nullam consectetur velit diam. Nunc ac semper dui, ac malesuada erat. Nullam elementum, lectus ut pulvinar
							varius, leo felis fermentum nibh, eu luctus ligula tortor eu justo. Proin suscipit ligula sed mi fermentum
							aliquam. Morbi fringilla commodo augue, nec laoreet magna viverra in. Suspendisse finibus vitae arcu quis
							sollicitudin. Morbi tempus ante congue massa blandit cursus. Mauris sit amet placerat turpis. Vivamus
							bibendum urna ut orci cursus commodo nec sed lacus. Cras lacinia pretium justo, non lobortis est bibendum
							a. Phasellus auctor eros eros, vel tempus metus sagittis ullamcorper. Duis sit amet rutrum sapien.
						</p>

						<p>
							Nullam nibh tortor, sodales ac ligula in, eleifend varius orci. Proin sollicitudin diam ligula, a dictum
							sapien dictum vitae. Suspendisse vulputate, mauris nec feugiat elementum, ligula neque lobortis mauris,
							sed venenatis purus neque ac magna. Vestibulum ullamcorper viverra vestibulum. Nunc sed libero turpis.
							Suspendisse potenti. Sed placerat, tellus a dignissim consequat, ex sapien dignissim lacus, et malesuada
							augue quam et dui. Aenean in lacus cursus, ultricies ligula at, elementum arcu. Phasellus ante erat,
							pretium quis scelerisque id, porta eu purus. Fusce malesuada elit et pellentesque dignissim. Nunc rutrum
							libero odio, et egestas sem condimentum at. Nullam lacus est, aliquam sit amet eleifend vel, aliquet ut
							odio. Vivamus cursus bibendum molestie. Mauris mollis metus quis laoreet placerat. Suspendisse facilisis
							malesuada dolor, a lobortis quam ultrices vitae.
						</p>

						<p>
							Phasellus sit amet enim sapien. In quis aliquam nunc. Aenean molestie tincidunt justo in blandit. Vivamus
							sodales viverra nunc, id lobortis nibh eleifend vel. Maecenas in tellus et nunc ultricies eleifend vitae
							vel nisl. Vestibulum quis suscipit dolor, non ullamcorper risus. Integer nec luctus neque, ut aliquam
							tortor. Morbi sem sem, blandit auctor ornare eu, dictum eget augue.
						</p>

						<p>
							In viverra dolor eget accumsan rutrum. Nullam est diam, dignissim non aliquam eget, aliquam sed eros.
							Pellentesque lacinia diam sed orci pellentesque, ac rhoncus lorem mollis. In efficitur eget erat at
							posuere. Vestibulum risus risus, venenatis ut felis imperdiet, tristique malesuada elit. Fusce tristique
							diam nec mauris dignissim, pulvinar dignissim sapien pretium. Nunc ornare blandit nulla a pulvinar. Nullam
							viverra ut tortor sollicitudin dictum. Integer ullamcorper nisi a aliquet aliquet. Donec tristique metus
							elementum mi consequat dapibus.
						</p>
					</div>
				}
				sideBarCenter="sideBarCenter"
				sideBarEnd="sideBarEnd"
				mainStart={
					<div style={{ fontSize: 12, margin: '10px 0' }}>
						<Trio start={<Breadcrumbs items={[<a href="#">Posts</a>, 'Edit post']} />} end={<ContentStatus />} />

						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ut diam sed augue commodo imperdiet. Nunc
							faucibus quam eget pellentesque condimentum. Curabitur ut quam nunc. Duis volutpat ultricies commodo.
							Curabitur non risus lacinia, viverra magna sed, pulvinar velit. Curabitur a auctor purus. Aenean eget
							ultricies enim. Praesent at mauris et libero porta rutrum et eget metus. Vivamus id magna metus. Aliquam
							ex neque, vehicula a nunc vitae, gravida dictum dolor. Phasellus risus mi, auctor quis ex id, vehicula
							rutrum nibh.
						</p>

						<p>
							Nullam consectetur velit diam. Nunc ac semper dui, ac malesuada erat. Nullam elementum, lectus ut pulvinar
							varius, leo felis fermentum nibh, eu luctus ligula tortor eu justo. Proin suscipit ligula sed mi fermentum
							aliquam. Morbi fringilla commodo augue, nec laoreet magna viverra in. Suspendisse finibus vitae arcu quis
							sollicitudin. Morbi tempus ante congue massa blandit cursus. Mauris sit amet placerat turpis. Vivamus
							bibendum urna ut orci cursus commodo nec sed lacus. Cras lacinia pretium justo, non lobortis est bibendum
							a. Phasellus auctor eros eros, vel tempus metus sagittis ullamcorper. Duis sit amet rutrum sapien.
						</p>

						<p>
							Nullam nibh tortor, sodales ac ligula in, eleifend varius orci. Proin sollicitudin diam ligula, a dictum
							sapien dictum vitae. Suspendisse vulputate, mauris nec feugiat elementum, ligula neque lobortis mauris,
							sed venenatis purus neque ac magna. Vestibulum ullamcorper viverra vestibulum. Nunc sed libero turpis.
							Suspendisse potenti. Sed placerat, tellus a dignissim consequat, ex sapien dignissim lacus, et malesuada
							augue quam et dui. Aenean in lacus cursus, ultricies ligula at, elementum arcu. Phasellus ante erat,
							pretium quis scelerisque id, porta eu purus. Fusce malesuada elit et pellentesque dignissim. Nunc rutrum
							libero odio, et egestas sem condimentum at. Nullam lacus est, aliquam sit amet eleifend vel, aliquet ut
							odio. Vivamus cursus bibendum molestie. Mauris mollis metus quis laoreet placerat. Suspendisse facilisis
							malesuada dolor, a lobortis quam ultrices vitae.
						</p>

						<p>
							Phasellus sit amet enim sapien. In quis aliquam nunc. Aenean molestie tincidunt justo in blandit. Vivamus
							sodales viverra nunc, id lobortis nibh eleifend vel. Maecenas in tellus et nunc ultricies eleifend vitae
							vel nisl. Vestibulum quis suscipit dolor, non ullamcorper risus. Integer nec luctus neque, ut aliquam
							tortor. Morbi sem sem, blandit auctor ornare eu, dictum eget augue.
						</p>

						<p>
							In viverra dolor eget accumsan rutrum. Nullam est diam, dignissim non aliquam eget, aliquam sed eros.
							Pellentesque lacinia diam sed orci pellentesque, ac rhoncus lorem mollis. In efficitur eget erat at
							posuere. Vestibulum risus risus, venenatis ut felis imperdiet, tristique malesuada elit. Fusce tristique
							diam nec mauris dignissim, pulvinar dignissim sapien pretium. Nunc ornare blandit nulla a pulvinar. Nullam
							viverra ut tortor sollicitudin dictum. Integer ullamcorper nisi a aliquet aliquet. Donec tristique metus
							elementum mi consequat dapibus.
						</p>
					</div>
				}
				mainCenter="mainCenter"
				mainEnd="mainEnd"
				actionsEnd={
					<SaveControl>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis nec ultrices neque. Suspendisse a ipsum eu
							dolor porttitor tincidunt. Quisque sed luctus urna, eu cursus nulla.
						</p>
						<p>
							Aliquam erat volutpat. Praesent vitae ex a urna porta dictum tincidunt in diam. Lorem ipsum dolor sit
							amet, consectetur adipiscing elit.
						</p>
					</SaveControl>
				}
			/>
		)
	})

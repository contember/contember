import { Component } from '@contember/binding'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'

export type ImmutableSingleEntityPageRendererProps = LayoutRendererProps

export const ImmutableSingleEntityPageRenderer = Component(LayoutRenderer, 'ImmutableSingleEntityPageRenderer')

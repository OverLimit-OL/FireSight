import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { illustrativeModel } from '@/services/mock/simulation/model'
import { modelParameterProfile } from '@/features/simulation/viewport/modelParameters'
import { defaultSceneSettings } from '@/features/simulation/viewport/sceneSettings'
import ParameterControls from '@/features/simulation/components/ParameterControls'
describe('scientific parameter capability boundary', () => {
  it('never exposes editable engine parameters for the illustrative model', () => {
    render(
      <ParameterControls
        group="engine"
        capabilities={modelParameterProfile(illustrativeModel).parameters}
        settings={defaultSceneSettings}
        onChange={() => {
          throw Error('No engine edit is permitted')
        }}
      />,
    )
    expect(screen.getByText('Flow velocity')).toBeVisible()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.getAllByText('Engine required')).toHaveLength(2)
  })
  it('does not inherit scientific inputs for an unknown model version', () => {
    const profile = modelParameterProfile({ ...illustrativeModel, version: '99.0.0' })
    expect(profile.parameters.filter((p) => p.group === 'engine')).toEqual([])
    expect(profile.parameters.find((p) => p.id === 'unpublished')).toMatchObject({
      kind: 'unavailable',
    })
  })
})

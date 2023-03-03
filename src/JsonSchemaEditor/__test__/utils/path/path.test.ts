import '@testing-library/jest-dom'
import { uri2strArray } from '../../../utils/path/uri'

describe('path', () => {
  it('uri2strArray', () => {
    expect(uri2strArray('#/abc/def')).toEqual(['abc', 'def'])
    expect(uri2strArray('#/abc/def/')).toEqual(['abc', 'def'])
    expect(uri2strArray('#/')).toEqual([])
    // expect(screen.queryByText(basic)).toBeInTheDocument();
  })
})

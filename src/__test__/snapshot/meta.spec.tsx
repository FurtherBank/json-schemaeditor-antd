import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import Editor from "../../Editor"

import $items from "../../json-example/$schema.items.json"
import items from "../../json-example/items.json"


import meta from "../../json-example/$meta.json"
afterEach(cleanup)

test("metaSnapshot", () => {
  const { asFragment } = render(<Editor data={$items} schema={meta} />)
  expect(asFragment()).toMatchSnapshot()
})

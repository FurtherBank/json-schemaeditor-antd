import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import Editor from "../../Editor"

import $Items from "../../schema-example/Itemsv20.json"
import Items from "../../json-example/Items.json"

import meta from "../../json-example/$meta.json"
afterEach(cleanup)

test("itemSnapshot", () => {
  const { asFragment } = render(<Editor data={Items} schema={$Items} />)
  expect(asFragment()).toMatchSnapshot()
})

import test from "ava"
import { linkComponent } from "../src/core/component/link-component"
import type {
  RenderResult,
  TopLevelComponent,
} from "../src/core/component/reply-component"
import { flattenRenderResult } from "../src/core/component/reply-component"
import {
  actionRowComponent,
  buttonComponent,
  embedComponent,
  selectMenuComponent,
} from "../src/main"

test("flattenRenderResult", (t) => {
  const button = buttonComponent({
    label: "button",
    style: "PRIMARY",
    onClick: () => {},
  })

  const link = linkComponent({
    label: "hi",
    url: "https://example.com",
  })

  const select = selectMenuComponent({
    options: [
      { label: "option1", value: "option1" },
      { label: "option2", value: "option2" },
    ],
    onSelect: () => {},
  })

  const embed = embedComponent({
    title: "a",
    description: "b",
  })

  type TestCase = {
    input: RenderResult
    expected: TopLevelComponent[]
  }

  const cases: TestCase[] = [
    {
      input: [],
      expected: [],
    },
    {
      input: button,
      expected: [actionRowComponent(button)],
    },
    {
      input: [button, button],
      expected: [actionRowComponent(button, button)],
    },
    {
      input: [select, button],
      expected: [actionRowComponent(select), actionRowComponent(button)],
    },
    {
      input: [button, select, button],
      expected: [
        actionRowComponent(button),
        actionRowComponent(select),
        actionRowComponent(button),
      ],
    },
    {
      input: [button, button, select, button],
      expected: [
        actionRowComponent(button, button),
        actionRowComponent(select),
        actionRowComponent(button),
      ],
    },
    {
      input: [select, select],
      expected: [actionRowComponent(select), actionRowComponent(select)],
    },
    {
      input: [select, select, button],
      expected: [
        actionRowComponent(select),
        actionRowComponent(select),
        actionRowComponent(button),
      ],
    },
    {
      input: ["hi", select, embed, select, button],
      expected: [
        { type: "text", text: "hi" },
        actionRowComponent(select),
        {
          type: "embed",
          embed: {
            title: "a",
            description: "b",
          },
        },
        actionRowComponent(select),
        actionRowComponent(button),
      ],
    },
    {
      input: [button, button, button, link, button, button, select, button],
      expected: [
        actionRowComponent(button, button, button, link, button),
        actionRowComponent(button),
        actionRowComponent(select),
        actionRowComponent(button),
      ],
    },
  ]

  for (const { input, expected } of cases) {
    t.deepEqual(flattenRenderResult(input), expected)
  }
})

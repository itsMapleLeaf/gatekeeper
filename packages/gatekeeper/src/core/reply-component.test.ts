import {
  actionRowComponent,
  buttonComponent,
  embedComponent,
  selectMenuComponent,
} from "../main"
import type { RenderResult, TopLevelComponent } from "./reply-component"
import { flattenRenderResult } from "./reply-component"

test("flattenRenderResult", () => {
  const button = buttonComponent({
    label: "button",
    style: "PRIMARY",
    onClick: () => {},
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
  ]

  for (const { input, expected } of cases) {
    expect(flattenRenderResult(input)).toEqual(expected)
  }
})

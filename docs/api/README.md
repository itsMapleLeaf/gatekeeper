API

# API

## Table of contents

### Type aliases

- [ActionRowChild](README.md#actionrowchild)
- [ActionRowComponent](README.md#actionrowcomponent)
- [AnyCommandDefinition](README.md#anycommanddefinition)
- [ButtonComponent](README.md#buttoncomponent)
- [ButtonInteractionContext](README.md#buttoninteractioncontext)
- [EmbedComponent](README.md#embedcomponent)
- [GatekeeperInstance](README.md#gatekeeperinstance)
- [GatekeeperOptions](README.md#gatekeeperoptions)
- [InteractionContext](README.md#interactioncontext)
- [MessageCommandDefinition](README.md#messagecommanddefinition)
- [MessageCommandInteractionContext](README.md#messagecommandinteractioncontext)
- [RenderReplyFn](README.md#renderreplyfn)
- [RenderResult](README.md#renderresult)
- [ReplyComponent](README.md#replycomponent)
- [ReplyHandle](README.md#replyhandle)
- [SelectInteractionContext](README.md#selectinteractioncontext)
- [SelectMenuComponent](README.md#selectmenucomponent)
- [SlashCommandDefinition](README.md#slashcommanddefinition)
- [SlashCommandInteractionContext](README.md#slashcommandinteractioncontext)
- [SlashCommandOptionDefinition](README.md#slashcommandoptiondefinition)
- [SlashCommandOptionValueTypes](README.md#slashcommandoptionvaluetypes)
- [SlashCommandOptions](README.md#slashcommandoptions)
- [TextComponent](README.md#textcomponent)
- [UseClientOptions](README.md#useclientoptions)
- [UserCommandDefinition](README.md#usercommanddefinition)
- [UserCommandInteractionContext](README.md#usercommandinteractioncontext)

### Functions

- [actionRowComponent](README.md#actionrowcomponent)
- [buttonComponent](README.md#buttoncomponent)
- [createGatekeeper](README.md#creategatekeeper)
- [createInteractionContext](README.md#createinteractioncontext)
- [createInteractionReplyOptions](README.md#createinteractionreplyoptions)
- [createMessageCommandContext](README.md#createmessagecommandcontext)
- [createSlashCommandContext](README.md#createslashcommandcontext)
- [createUserCommandContext](README.md#createusercommandcontext)
- [defineMessageCommand](README.md#definemessagecommand)
- [defineSlashCommand](README.md#defineslashcommand)
- [defineUserCommand](README.md#defineusercommand)
- [embedComponent](README.md#embedcomponent)
- [flattenRenderResult](README.md#flattenrenderresult)
- [getInteractiveComponents](README.md#getinteractivecomponents)
- [isMessageCommandDefinition](README.md#ismessagecommanddefinition)
- [isSlashCommandDefinition](README.md#isslashcommanddefinition)
- [isUserCommandDefinition](README.md#isusercommanddefinition)
- [selectMenuComponent](README.md#selectmenucomponent)

## Type aliases

### ActionRowChild

Ƭ **ActionRowChild**: [`SelectMenuComponent`](README.md#selectmenucomponent) \| [`ButtonComponent`](README.md#buttoncomponent)

#### Defined in

[core/components/action-row.ts:9](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/action-row.ts#L9)

___

### ActionRowComponent

Ƭ **ActionRowComponent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `children` | [`ActionRowChild`](README.md#actionrowchild)[] |
| `type` | ``"actionRow"`` |

#### Defined in

[core/components/action-row.ts:4](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/action-row.ts#L4)

___

### AnyCommandDefinition

Ƭ **AnyCommandDefinition**<`Options`\>: [`SlashCommandDefinition`](README.md#slashcommanddefinition)<`Options`\> \| [`UserCommandDefinition`](README.md#usercommanddefinition) \| [`MessageCommandDefinition`](README.md#messagecommanddefinition)

A command definition

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`SlashCommandOptions`](README.md#slashcommandoptions)[`SlashCommandOptions`](README.md#slashcommandoptions) |

#### Defined in

[core/gatekeeper.ts:67](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/gatekeeper.ts#L67)

___

### ButtonComponent

Ƭ **ButtonComponent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `customId` | `string` |
| `emoji?` | `EmojiResolvable` |
| `label` | `string` |
| `onClick` | (`context`: [`InteractionContext`](README.md#interactioncontext)) => `void` |
| `style` | `MessageButtonStyle` |
| `type` | ``"button"`` |

#### Defined in

[core/components/button.ts:5](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/button.ts#L5)

___

### ButtonInteractionContext

Ƭ **ButtonInteractionContext**: [`InteractionContext`](README.md#interactioncontext)

#### Defined in

[core/components/button.ts:14](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/button.ts#L14)

___

### EmbedComponent

Ƭ **EmbedComponent**: `ReturnType`<typeof [`embedComponent`](README.md#embedcomponent)\>

#### Defined in

[core/components/embed.ts:3](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/embed.ts#L3)

___

### GatekeeperInstance

Ƭ **GatekeeperInstance**: `Object`

Manages commands and handles interactions.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addCommand` | <Options\>(`definition`: [`AnyCommandDefinition`](README.md#anycommanddefinition)<`Options`\>) => `void` |
| `loadCommands` | (`filePaths`: `ArrayLike`<`string`\>) => `Promise`<`void`\> |
| `useClient` | (`client`: `Client`<`boolean`\>, `options?`: [`UseClientOptions`](README.md#useclientoptions)) => `void` |

#### Defined in

[core/gatekeeper.ts:77](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/gatekeeper.ts#L77)

___

### GatekeeperOptions

Ƭ **GatekeeperOptions**: `Object`

Options for creating a gatekeeper instance.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `debug?` | `boolean` | Enables debug logging. Shows when commands are created, activated, registered, etc. |

#### Defined in

[core/gatekeeper.ts:35](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/gatekeeper.ts#L35)

___

### InteractionContext

Ƭ **InteractionContext**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `channel` | `Discord.TextBasedChannels` \| `undefined` |
| `defer` | () => `void` |
| `ephemeralReply` | (`render`: [`RenderReplyFn`](README.md#renderreplyfn)) => `void` |
| `guild` | `Discord.Guild` \| `undefined` |
| `member` | `Discord.GuildMember` \| `undefined` |
| `reply` | (`render`: [`RenderReplyFn`](README.md#renderreplyfn)) => [`ReplyHandle`](README.md#replyhandle) |
| `user` | `Discord.User` |

#### Defined in

[core/interaction-context.ts:12](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/interaction-context.ts#L12)

___

### MessageCommandDefinition

Ƭ **MessageCommandDefinition**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `__type` | typeof `messageCommandType` |
| `name` | `string` |
| `run` | (`context`: [`MessageCommandInteractionContext`](README.md#messagecommandinteractioncontext)) => `void` \| `Promise`<`unknown`\> |

#### Defined in

[core/message-command.ts:9](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/message-command.ts#L9)

___

### MessageCommandInteractionContext

Ƭ **MessageCommandInteractionContext**: [`InteractionContext`](README.md#interactioncontext) & { `targetMessage`: `Discord.Message`  }

#### Defined in

[core/message-command.ts:20](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/message-command.ts#L20)

___

### RenderReplyFn

Ƭ **RenderReplyFn**: () => [`RenderResult`](README.md#renderresult)

#### Type declaration

▸ (): [`RenderResult`](README.md#renderresult)

##### Returns

[`RenderResult`](README.md#renderresult)

#### Defined in

[core/reply-component.ts:24](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/reply-component.ts#L24)

___

### RenderResult

Ƭ **RenderResult**: [`ReplyComponent`](README.md#replycomponent) \| [`ButtonComponent`](README.md#buttoncomponent) \| [`SelectMenuComponent`](README.md#selectmenucomponent) \| `string` \| `number` \| `boolean` \| `undefined` \| ``null`` \| [`RenderResult`](README.md#renderresult)[]

#### Defined in

[core/reply-component.ts:26](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/reply-component.ts#L26)

___

### ReplyComponent

Ƭ **ReplyComponent**: [`TextComponent`](README.md#textcomponent) \| [`EmbedComponent`](README.md#embedcomponent) \| [`ActionRowComponent`](README.md#actionrowcomponent)

#### Defined in

[core/reply-component.ts:17](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/reply-component.ts#L17)

___

### ReplyHandle

Ƭ **ReplyHandle**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `delete` | () => `void` |
| `refresh` | () => `void` |

#### Defined in

[core/interaction-context.ts:25](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/interaction-context.ts#L25)

___

### SelectInteractionContext

Ƭ **SelectInteractionContext**: [`InteractionContext`](README.md#interactioncontext) & { `values`: `string`[]  }

#### Defined in

[core/components/select-menu.ts:15](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/select-menu.ts#L15)

___

### SelectMenuComponent

Ƭ **SelectMenuComponent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `customId` | `string` |
| `maxValues?` | `number` |
| `minValues?` | `number` |
| `onSelect` | (`context`: [`SelectInteractionContext`](README.md#selectinteractioncontext)) => `void` |
| `options` | `MessageSelectOptionData`[] |
| `placeholder?` | `string` |
| `type` | ``"selectMenu"`` |

#### Defined in

[core/components/select-menu.ts:5](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/select-menu.ts#L5)

___

### SlashCommandDefinition

Ƭ **SlashCommandDefinition**<`Options`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`SlashCommandOptions`](README.md#slashcommandoptions)[`SlashCommandOptions`](README.md#slashcommandoptions) |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `__type` | typeof `slashCommandType` |
| `description` | `string` |
| `name` | `string` |
| `options?` | `Options` |
| `run` | (`context`: [`SlashCommandInteractionContext`](README.md#slashcommandinteractioncontext)<`Options`\>) => `void` \| `Promise`<`unknown`\> |

#### Defined in

[core/slash-command.ts:9](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L9)

___

### SlashCommandInteractionContext

Ƭ **SlashCommandInteractionContext**<`Options`\>: [`InteractionContext`](README.md#interactioncontext) & { `options`: { [Name in keyof Options]: Options[Name]["required"] extends true ? SlashCommandOptionValueTypes[Options[Name]["type"]] : SlashCommandOptionValueTypes[Options[Name]["type"]] \| undefined}  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`SlashCommandOptions`](README.md#slashcommandoptions)[`SlashCommandOptions`](README.md#slashcommandoptions) |

#### Defined in

[core/slash-command.ts:21](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L21)

___

### SlashCommandOptionDefinition

Ƭ **SlashCommandOptionDefinition**: { `choices?`: { `name`: `string` ; `value`: `string`  }[] ; `description`: `string` ; `required?`: `boolean` ; `type`: ``"STRING"``  } \| { `choices?`: { `name`: `string` ; `value`: `number`  }[] ; `description`: `string` ; `required?`: `boolean` ; `type`: ``"NUMBER"`` \| ``"INTEGER"``  } \| { `description`: `string` ; `required?`: `boolean` ; `type`: ``"BOOLEAN"``  }

#### Defined in

[core/slash-command.ts:35](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L35)

___

### SlashCommandOptionValueTypes

Ƭ **SlashCommandOptionValueTypes**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `BOOLEAN` | `boolean` |
| `INTEGER` | `number` |
| `NUMBER` | `number` |
| `STRING` | `string` |

#### Defined in

[core/slash-command.ts:54](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L54)

___

### SlashCommandOptions

Ƭ **SlashCommandOptions**: `Object`

#### Index signature

▪ [name: `string`]: [`SlashCommandOptionDefinition`](README.md#slashcommandoptiondefinition)

#### Defined in

[core/slash-command.ts:31](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L31)

___

### TextComponent

Ƭ **TextComponent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `text` | `string` |
| `type` | ``"text"`` |

#### Defined in

[core/reply-component.ts:19](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/reply-component.ts#L19)

___

### UseClientOptions

Ƭ **UseClientOptions**: `Object`

Options for attaching a client to a gatekeeper instance.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `useGlobalCommands?` | `boolean` | Register global commands.  Global commands can be used from any server, and take a while to show up, so this isn't great for testing. I'd recommend only enabling this if you're scaling the bot up to many servers/channels, when using guild commands reaches the 100 total command limit for a bot.  **`default`** false |
| `useGuildCommands?` | `boolean` | Registers commands per guild.  The commands are immediately available for use, which makes this much better for development, and works fine for small bots that are only used in a few servers.   **`default`** true |

#### Defined in

[core/gatekeeper.ts:45](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/gatekeeper.ts#L45)

___

### UserCommandDefinition

Ƭ **UserCommandDefinition**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `__type` | typeof `userCommandType` |
| `name` | `string` |
| `run` | (`context`: [`UserCommandInteractionContext`](README.md#usercommandinteractioncontext)) => `void` \| `Promise`<`unknown`\> |

#### Defined in

[core/user-command.ts:9](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/user-command.ts#L9)

___

### UserCommandInteractionContext

Ƭ **UserCommandInteractionContext**: [`InteractionContext`](README.md#interactioncontext) & { `targetGuildMember`: `Discord.GuildMember` \| `undefined` ; `targetUser`: `Discord.User`  }

#### Defined in

[core/user-command.ts:20](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/user-command.ts#L20)

## Functions

### actionRowComponent

▸ **actionRowComponent**(...`children`): [`ActionRowComponent`](README.md#actionrowcomponent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `...children` | ([`ActionRowChild`](README.md#actionrowchild) \| [`ActionRowChild`](README.md#actionrowchild)[])[] |

#### Returns

[`ActionRowComponent`](README.md#actionrowcomponent)

#### Defined in

[core/components/action-row.ts:11](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/action-row.ts#L11)

___

### buttonComponent

▸ **buttonComponent**(`options`): [`ButtonComponent`](README.md#buttoncomponent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Omit`<[`ButtonComponent`](README.md#buttoncomponent), ``"type"`` \| ``"customId"``\> |

#### Returns

[`ButtonComponent`](README.md#buttoncomponent)

#### Defined in

[core/components/button.ts:16](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/button.ts#L16)

___

### createGatekeeper

▸ **createGatekeeper**(`__namedParameters?`): [`GatekeeperInstance`](README.md#gatekeeperinstance)

Create a gatekeeper instance.

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | [`GatekeeperOptions`](README.md#gatekeeperoptions) |

#### Returns

[`GatekeeperInstance`](README.md#gatekeeperinstance)

#### Defined in

[core/gatekeeper.ts:99](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/gatekeeper.ts#L99)

___

### createInteractionContext

▸ **createInteractionContext**(`interaction`, `logger`, `actionQueue`): [`InteractionContext`](README.md#interactioncontext)

#### Parameters

| Name | Type |
| :------ | :------ |
| `interaction` | `Discord.CommandInteraction` \| `Discord.MessageComponentInteraction` |
| `logger` | `Logger` |
| `actionQueue` | `ReturnType`<typeof `createActionQueue`\> |

#### Returns

[`InteractionContext`](README.md#interactioncontext)

#### Defined in

[core/interaction-context.ts:39](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/interaction-context.ts#L39)

___

### createInteractionReplyOptions

▸ **createInteractionReplyOptions**(`components`): `InteractionReplyOptions`

#### Parameters

| Name | Type |
| :------ | :------ |
| `components` | [`ReplyComponent`](README.md#replycomponent)[] |

#### Returns

`InteractionReplyOptions`

#### Defined in

[core/reply-component.ts:119](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/reply-component.ts#L119)

___

### createMessageCommandContext

▸ **createMessageCommandContext**(`interaction`, `logger`): `Promise`<[`MessageCommandInteractionContext`](README.md#messagecommandinteractioncontext)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `interaction` | `Discord.ContextMenuInteraction` |
| `logger` | `Logger` |

#### Returns

`Promise`<[`MessageCommandInteractionContext`](README.md#messagecommandinteractioncontext)\>

#### Defined in

[core/message-command.ts:38](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/message-command.ts#L38)

___

### createSlashCommandContext

▸ **createSlashCommandContext**(`slashCommand`, `interaction`, `logger`): [`SlashCommandInteractionContext`](README.md#slashcommandinteractioncontext)

#### Parameters

| Name | Type |
| :------ | :------ |
| `slashCommand` | [`SlashCommandDefinition`](README.md#slashcommanddefinition) |
| `interaction` | `Discord.CommandInteraction` |
| `logger` | `Logger` |

#### Returns

[`SlashCommandInteractionContext`](README.md#slashcommandinteractioncontext)

#### Defined in

[core/slash-command.ts:78](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L78)

___

### createUserCommandContext

▸ **createUserCommandContext**(`interaction`, `logger`): `Promise`<[`UserCommandInteractionContext`](README.md#usercommandinteractioncontext)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `interaction` | `Discord.ContextMenuInteraction` |
| `logger` | `Logger` |

#### Returns

`Promise`<[`UserCommandInteractionContext`](README.md#usercommandinteractioncontext)\>

#### Defined in

[core/user-command.ts:39](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/user-command.ts#L39)

___

### defineMessageCommand

▸ **defineMessageCommand**(`definition`): [`MessageCommandDefinition`](README.md#messagecommanddefinition)

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | `MessageCommandDefinitionWithoutType` |

#### Returns

[`MessageCommandDefinition`](README.md#messagecommanddefinition)

#### Defined in

[core/message-command.ts:26](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/message-command.ts#L26)

___

### defineSlashCommand

▸ **defineSlashCommand**<`Options`\>(`definition`): [`SlashCommandDefinition`](README.md#slashcommanddefinition)<`Options`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`SlashCommandOptions`](README.md#slashcommandoptions) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | `SlashCommandDefinitionWithoutType`<`Options`\> |

#### Returns

[`SlashCommandDefinition`](README.md#slashcommanddefinition)<`Options`\>

#### Defined in

[core/slash-command.ts:66](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L66)

___

### defineUserCommand

▸ **defineUserCommand**(`definition`): [`UserCommandDefinition`](README.md#usercommanddefinition)

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | `UserCommandDefinitionWithoutType` |

#### Returns

[`UserCommandDefinition`](README.md#usercommanddefinition)

#### Defined in

[core/user-command.ts:27](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/user-command.ts#L27)

___

### embedComponent

▸ **embedComponent**(`embed`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `embed` | `MessageEmbedOptions` \| `MessageEmbed` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `embed` | `MessageEmbedOptions` \| `MessageEmbed` |
| `type` | ``"embed"`` |

#### Defined in

[core/components/embed.ts:5](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/embed.ts#L5)

___

### flattenRenderResult

▸ **flattenRenderResult**(`result`): [`ReplyComponent`](README.md#replycomponent)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`RenderResult`](README.md#renderresult) |

#### Returns

[`ReplyComponent`](README.md#replycomponent)[]

#### Defined in

[core/reply-component.ts:60](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/reply-component.ts#L60)

___

### getInteractiveComponents

▸ **getInteractiveComponents**(`result`): [`ActionRowChild`](README.md#actionrowchild)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | [`RenderResult`](README.md#renderresult) |

#### Returns

[`ActionRowChild`](README.md#actionrowchild)[]

#### Defined in

[core/reply-component.ts:111](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/reply-component.ts#L111)

___

### isMessageCommandDefinition

▸ **isMessageCommandDefinition**(`definition`): definition is MessageCommandDefinition

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | `unknown` |

#### Returns

definition is MessageCommandDefinition

#### Defined in

[core/message-command.ts:32](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/message-command.ts#L32)

___

### isSlashCommandDefinition

▸ **isSlashCommandDefinition**(`definition`): definition is SlashCommandDefinition<any\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | `unknown` |

#### Returns

definition is SlashCommandDefinition<any\>

#### Defined in

[core/slash-command.ts:72](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/slash-command.ts#L72)

___

### isUserCommandDefinition

▸ **isUserCommandDefinition**(`definition`): definition is UserCommandDefinition

#### Parameters

| Name | Type |
| :------ | :------ |
| `definition` | `unknown` |

#### Returns

definition is UserCommandDefinition

#### Defined in

[core/user-command.ts:33](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/user-command.ts#L33)

___

### selectMenuComponent

▸ **selectMenuComponent**(`__namedParameters`): [`SelectMenuComponent`](README.md#selectmenucomponent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.maxValues?` | `number` |
| `__namedParameters.minValues?` | `number` |
| `__namedParameters.onSelect` | (`context`: [`SelectInteractionContext`](README.md#selectinteractioncontext)) => `void` |
| `__namedParameters.options` | `MessageSelectOptionData`[] |
| `__namedParameters.placeholder?` | `string` |
| `__namedParameters.selected?` | `Iterable`<`string`\> \| `string` |

#### Returns

[`SelectMenuComponent`](README.md#selectmenucomponent)

#### Defined in

[core/components/select-menu.ts:17](https://github.com/itsMapleLeaf/gatekeeper/blob/c684bc0/packages/gatekeeper/src/core/components/select-menu.ts#L17)

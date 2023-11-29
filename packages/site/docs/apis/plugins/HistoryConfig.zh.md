---
title: History 历史记录
order: 1
---

- [撤销重做](/examples/tool/history/#history)

## 配置项

### enableStack

**类型**：`boolean`

**默认值**：`false`

是否启用堆栈

### stackCfg <Badge type="error">必须</Badge>

**类型**：`StackCfg`

<embed src="../../common/StackCfg.zh.md"></embed>

**默认值**：`{}`

堆栈配置

## API

### canRedo

**类型**：`() => boolean;`

**说明**：是否可以重做

### canUndo

**类型**：`() => boolean;`

**说明**：是否可以撤销

### clear

**类型**：`() => void;`

**说明**：清空堆栈

### clearRedoStack

**类型**：`() => void;`

**说明**：清空重做堆栈

### clearUndoStack

**类型**：`() => void;`

**说明**：清空撤销堆栈

### isEnable

**类型**：`() => boolean;`

**说明**：是否启用堆栈

### getStack

**类型**：`() => Record<string, Command[][]>;`

<embed src="../../common/PluginHistoryCommand.zh.md"></embed>

**说明**：获取堆栈

### getRedoStack

**类型**：`() => Command[][];`

<embed src="../../common/PluginHistoryCommand.zh.md"></embed>

**说明**：获取重做堆栈

### getUndoStack

**类型**：`() => Command[][];`

<embed src="../../common/PluginHistoryCommand.zh.md"></embed>

**说明**：获取撤销堆栈

### historyBatch

**类型**：`(callback: () => void) => void;`

**说明**：以 historyBatch 模式执行所提供的函数

### notify

**类型**：`(graph: IGraph, eventName: string, ...data: any[]) => void;`

**说明**：事件通知

### push

**类型**：`(commands: Command[], stackType: StackType = 'undo', isNew = true) => void;`

<embed src="../../common/PluginHistoryCommand.zh.md"></embed>

<details>
  <summary style="color: #873bf4; cursor: pointer;">
    StackType
  </summary>

```ts
type StackType = 'redo' | 'undo';
```

</details>

**说明**：推入堆栈

### redo

**类型**：`() => void;`

**说明**：重做

### undo

**类型**：`() => void;`

**说明**：撤销

### startHistoryBatch

**类型**：`() => void;`

**说明**：开始历史批处理

### stopHistoryBatch

**类型**：`() => void;`

**说明**：结束历史批处理

<embed src="../../common/PluginAPIDestroy.zh.md"></embed>
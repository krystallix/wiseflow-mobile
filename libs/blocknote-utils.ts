// ─── BlockNote JSON Types ────────────────────────────────────────────────────

export type InlineStyle = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  textColor?: string
}

export type TextContent = {
  type: 'text'
  text: string
  styles: InlineStyle
}

export type LinkContent = {
  type: 'link'
  href: string
  content: TextContent[]
}

export type InlineContent = TextContent | LinkContent

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'bulletListItem'
  | 'numberedListItem'
  | 'checkListItem'
  | 'codeBlock'

export type HeadingProps = { level: 1 | 2 | 3 }
export type CheckListProps = { checked: boolean }

export type BNBlock = {
  id: string
  type: BlockType
  props: HeadingProps | CheckListProps | Record<string, unknown>
  content: InlineContent[]
  children: BNBlock[]
}

// ─── Internal Editor Block ────────────────────────────────────────────────────

/** Simplified internal representation used by the mobile editor */
export type EditorBlock = {
  id: string
  type: BlockType
  props: Record<string, unknown>
  text: string
  styles: InlineStyle
  checked?: boolean
}

// ─── Utilities ────────────────────────────────────────────────────────────────

let _id = 0
export function genId(): string {
  return `mobile-${Date.now()}-${++_id}`
}

/** Extract plain text from InlineContent[] */
export function inlineToText(content: InlineContent[]): string {
  return content
    .map(c => {
      if (c.type === 'text') return c.text
      if (c.type === 'link') return c.content.map(t => t.text).join('')
      return ''
    })
    .join('')
}

/** Get dominant inline style from first text node */
export function inlineToStyle(content: InlineContent[]): InlineStyle {
  const first = content.find(c => c.type === 'text') as TextContent | undefined
  return first?.styles ?? {}
}

// ─── Parse BlockNote JSON → EditorBlock[] ─────────────────────────────────────

export function parseBlockNote(raw: string | null | undefined): EditorBlock[] {
  if (!raw) return [{ id: genId(), type: 'paragraph', props: {}, text: '', styles: {} }]

  let blocks: BNBlock[]
  try {
    const parsed = JSON.parse(raw)
    blocks = Array.isArray(parsed) ? parsed : []
  } catch {
    // Legacy: plain text stored as string
    return raw
      .split('\n')
      .map(line => ({ id: genId(), type: 'paragraph' as BlockType, props: {}, text: line, styles: {} }))
  }

  const result: EditorBlock[] = []

  function flatten(block: BNBlock, depth = 0) {
    result.push({
      id: block.id || genId(),
      type: block.type,
      props: block.props as Record<string, unknown>,
      text: inlineToText(block.content),
      styles: inlineToStyle(block.content),
      checked: (block.props as CheckListProps).checked,
    })
    block.children?.forEach(c => flatten(c, depth + 1))
  }

  blocks.forEach(b => flatten(b))

  if (result.length === 0) {
    return [{ id: genId(), type: 'paragraph', props: {}, text: '', styles: {} }]
  }
  return result
}

// ─── Serialize EditorBlock[] → BlockNote JSON ─────────────────────────────────

export function serializeToBlockNote(blocks: EditorBlock[]): string {
  const bnBlocks: BNBlock[] = blocks.map(b => ({
    id: b.id,
    type: b.type,
    props: b.type === 'checkListItem'
      ? { checked: b.checked ?? false }
      : b.type === 'heading'
      ? { level: (b.props.level as number) ?? 1 }
      : {},
    content: b.text
      ? [{ type: 'text' as const, text: b.text, styles: b.styles }]
      : [],
    children: [],
  }))
  return JSON.stringify(bnBlocks)
}

// ─── Extract plain-text excerpt ────────────────────────────────────────────────

export function blockNoteExcerpt(raw: string | null | undefined, maxLen = 100): string {
  const blocks = parseBlockNote(raw)
  const text = blocks.map(b => b.text).join(' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

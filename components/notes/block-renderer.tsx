import React from 'react';
import { View, Text } from 'react-native';
import {
  parseBlockNote,
  type EditorBlock,
  type InlineStyle,
} from '@/libs/blocknote-utils';

// ─── Inline styled text ───────────────────────────────────────────────────────

function StyledText({ text, styles }: { text: string; styles: InlineStyle }) {
  const isBold = styles.bold;
  const isItalic = styles.italic;
  const isUnderline = styles.underline;
  const isStrikethrough = styles.strikethrough;
  const isCode = styles.code;

  if (isCode) {
    return (
      <Text
        style={{
          fontFamily: 'monospace',
          backgroundColor: '#f1f5f9',
          color: '#6366f1',
          paddingHorizontal: 4,
          paddingVertical: 1,
          borderRadius: 4,
          fontSize: 13,
        }}
      >
        {text}
      </Text>
    );
  }

  return (
    <Text
      style={{
        fontWeight: isBold ? '700' : '400',
        fontStyle: isItalic ? 'italic' : 'normal',
        textDecorationLine:
          isUnderline && isStrikethrough
            ? 'underline line-through'
            : isUnderline
            ? 'underline'
            : isStrikethrough
            ? 'line-through'
            : 'none',
        color: styles.textColor || undefined,
      }}
    >
      {text}
    </Text>
  );
}

// ─── Render a single block ────────────────────────────────────────────────────

function BlockView({ block, index }: { block: EditorBlock; index: number }) {
  const type = block.type;

  const baseText = (
    <StyledText text={block.text} styles={block.styles} />
  );

  if (type === 'heading') {
    const level = (block.props.level as number) ?? 1;
    const sizes = [28, 22, 18];
    const size = sizes[level - 1] ?? 16;
    return (
      <Text
        style={{
          fontSize: size,
          fontWeight: '800',
          lineHeight: size * 1.3,
          marginTop: level === 1 ? 8 : 4,
          marginBottom: 2,
          color: undefined,
        }}
      >
        {block.text}
      </Text>
    );
  }

  if (type === 'bulletListItem') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
        <Text style={{ fontSize: 16, lineHeight: 24, marginRight: 8, marginTop: 1 }}>•</Text>
        <Text style={{ fontSize: 15, lineHeight: 24, flex: 1 }}>{baseText}</Text>
      </View>
    );
  }

  if (type === 'numberedListItem') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
        <Text style={{ fontSize: 15, lineHeight: 24, marginRight: 6, minWidth: 20 }}>{index + 1}.</Text>
        <Text style={{ fontSize: 15, lineHeight: 24, flex: 1 }}>{baseText}</Text>
      </View>
    );
  }

  if (type === 'checkListItem') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
        <Text style={{ fontSize: 16, lineHeight: 24, marginRight: 8 }}>
          {block.checked ? '☑' : '☐'}
        </Text>
        <Text
          style={{
            fontSize: 15,
            lineHeight: 24,
            flex: 1,
            textDecorationLine: block.checked ? 'line-through' : 'none',
            opacity: block.checked ? 0.5 : 1,
          }}
        >
          {baseText}
        </Text>
      </View>
    );
  }

  if (type === 'codeBlock') {
    return (
      <View
        style={{
          backgroundColor: '#f1f5f9',
          borderRadius: 8,
          padding: 12,
          marginVertical: 4,
        }}
      >
        <Text style={{ fontFamily: 'monospace', fontSize: 13, color: '#334155', lineHeight: 20 }}>
          {block.text}
        </Text>
      </View>
    );
  }

  // paragraph
  if (!block.text) {
    return <View style={{ height: 8 }} />;
  }
  return (
    <Text style={{ fontSize: 15, lineHeight: 24, marginBottom: 2 }}>
      {baseText}
    </Text>
  );
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

type BlockNoteRendererProps = {
  content: string | null | undefined;
};

export default function BlockNoteRenderer({ content }: BlockNoteRendererProps) {
  const blocks = parseBlockNote(content);

  let numberedIndex = -1;

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === 'numberedListItem') {
          numberedIndex++;
        } else {
          numberedIndex = -1;
        }
        return (
          <BlockView
            key={block.id}
            block={block}
            index={numberedIndex}
          />
        );
      })}
    </View>
  );
}

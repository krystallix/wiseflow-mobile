import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  Trash2,
  Plus,
  Type,
} from 'lucide-react-native';
import {
  parseBlockNote,
  serializeToBlockNote,
  genId,
  type EditorBlock,
  type BlockType,
  type InlineStyle,
} from '@/libs/blocknote-utils';

// ─── Toolbar config ───────────────────────────────────────────────────────────

type ToolbarAction =
  | { kind: 'style'; key: keyof InlineStyle; icon: React.ReactNode }
  | { kind: 'type'; value: BlockType; props?: Record<string, unknown>; icon: React.ReactNode }
  | { kind: 'separator' }
  | { kind: 'action'; id: string; icon: React.ReactNode; label: string }

// ─── Single Block Input ───────────────────────────────────────────────────────

function BlockInput({
  block,
  isFocused,
  onFocus,
  onChange,
  onEnter,
  onBackspace,
}: {
  block: EditorBlock;
  isFocused: boolean;
  onFocus: () => void;
  onChange: (text: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
}) {
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (isFocused) inputRef.current?.focus();
  }, [isFocused]);

  const type = block.type;
  const props = block.props;
  const level = (props.level as number) ?? 1;

  const fontSizeMap = {
    paragraph: 15,
    heading: level === 1 ? 26 : level === 2 ? 21 : 17,
    bulletListItem: 15,
    numberedListItem: 15,
    checkListItem: 15,
    codeBlock: 13,
  };

  const placeholder = {
    paragraph: 'Add text...',
    heading: level === 1 ? 'Heading 1' : level === 2 ? 'Heading 2' : 'Heading 3',
    bulletListItem: 'List item',
    numberedListItem: 'List item',
    checkListItem: 'Task',
    codeBlock: 'Code...',
  }[type] ?? 'Type here...';

  const prefix: string | null = type === 'bulletListItem'
    ? '•'
    : type === 'checkListItem'
    ? block.checked ? '☑' : '☐'
    : null;

  const fontStyle: 'italic' | 'normal' = block.styles.italic ? 'italic' : 'normal';
  const fontWeight: '700' | '800' | '400' = type === 'heading'
    ? level === 1 ? '800' : '700'
    : block.styles.bold ? '700' : '400';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 2 }}>
      {prefix && (
        <Pressable
          onPress={() => {
            if (type === 'checkListItem') {
              onChange(block.text); // trigger re-render, checked toggled by parent
            }
          }}
          style={{ marginRight: 8, marginTop: fontSizeMap[type] * 0.4 }}
        >
          <Text style={{ fontSize: 16, color: '#64748b' }}>{prefix}</Text>
        </Pressable>
      )}
      <TextInput
        ref={inputRef}
        value={block.text}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={type !== 'heading'}
        onFocus={onFocus}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === 'Enter') onEnter();
          if (nativeEvent.key === 'Backspace' && block.text === '') onBackspace();
        }}
        style={{
          flex: 1,
          fontSize: fontSizeMap[type],
          fontWeight,
          fontStyle,
          fontFamily: type === 'codeBlock' ? 'monospace' : undefined,
          textDecorationLine:
            block.styles.underline && block.styles.strikethrough
              ? 'underline line-through'
              : block.styles.underline
              ? 'underline'
              : block.styles.strikethrough
              ? 'line-through'
              : 'none',
          color: type === 'codeBlock' ? '#6366f1' : undefined,
          backgroundColor: type === 'codeBlock' ? '#f1f5f9' : undefined,
          borderRadius: type === 'codeBlock' ? 8 : 0,
          padding: type === 'codeBlock' ? 12 : 0,
          lineHeight: fontSizeMap[type] * 1.55,
          minHeight: fontSizeMap[type] * 1.8,
        }}
      />
    </View>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

type BlockEditorProps = {
  /** Title (stored separately from BlockNote content) */
  title: string;
  onTitleChange: (t: string) => void;
  /** BlockNote JSON string from database */
  content: string | null | undefined;
  /** Called whenever content changes — receives serialized BlockNote JSON */
  onContentChange: (json: string) => void;
  /** Pass through for autosave title+content */
  onSave?: (title: string, json: string) => void;
};

export default function BlockEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  onSave,
}: BlockEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => parseBlockNote(content));
  // A ref mirror so we can read current blocks synchronously without closure staleness
  const blocksRef = useRef<EditorBlock[]>(blocks);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-parse when a different note is loaded
  useEffect(() => {
    const parsed = parseBlockNote(content);
    blocksRef.current = parsed;
    setBlocks(parsed);
  }, [content]);

  // emit must NEVER be called inside a setState updater.
  // It is only called after setBlocks completes.
  const emit = useCallback((next: EditorBlock[]) => {
    const json = serializeToBlockNote(next);
    // Use setTimeout(0) so this runs after the current render cycle,
    // preventing "setState during render" errors.
    setTimeout(() => {
      onContentChange(json);
      if (onSave) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onSave(title, json), 700);
      }
    }, 0);
  }, [onContentChange, onSave, title]);

  // Helper: set blocks from next, keep ref in sync, fire emit after
  const commitBlocks = useCallback((next: EditorBlock[]) => {
    blocksRef.current = next;
    setBlocks(next);
    emit(next);
  }, [emit]);

  const updateBlock = useCallback((index: number, patch: Partial<EditorBlock>) => {
    const next = blocksRef.current.map((b, i) => i === index ? { ...b, ...patch } : b);
    commitBlocks(next);
  }, [commitBlocks]);

  const insertBlockAfter = useCallback((index: number) => {
    const current = blocksRef.current[index];
    let newType: BlockType = 'paragraph';
    let newProps: Record<string, unknown> = {};
    if (current?.type === 'bulletListItem') newType = 'bulletListItem';
    if (current?.type === 'numberedListItem') newType = 'numberedListItem';
    if (current?.type === 'checkListItem') { newType = 'checkListItem'; newProps = { checked: false }; }

    const newBlock: EditorBlock = { id: genId(), type: newType, props: newProps, text: '', styles: {} };
    const prev = blocksRef.current;
    const next = [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)];
    commitBlocks(next);
    setFocusedIndex(index + 1);
  }, [commitBlocks]);

  const removeBlock = useCallback((index: number) => {
    const prev = blocksRef.current;
    if (prev.length <= 1) return;
    const next = prev.filter((_, i) => i !== index);
    commitBlocks(next);
    setFocusedIndex(Math.max(0, index - 1));
  }, [commitBlocks]);

  const toggleStyle = useCallback((key: keyof InlineStyle) => {
    const next = blocksRef.current.map((b, i) =>
      i === focusedIndex
        ? { ...b, styles: { ...b.styles, [key]: !b.styles[key] } }
        : b
    );
    commitBlocks(next);
  }, [focusedIndex, commitBlocks]);

  const changeType = useCallback((type: BlockType, props: Record<string, unknown> = {}) => {
    const next = blocksRef.current.map((b, i) =>
      i === focusedIndex ? { ...b, type, props } : b
    );
    commitBlocks(next);
  }, [focusedIndex, commitBlocks]);

  const toggleChecked = useCallback((index: number) => {
    const next = blocksRef.current.map((b, i) =>
      i === index && b.type === 'checkListItem'
        ? { ...b, checked: !b.checked }
        : b
    );
    commitBlocks(next);
  }, [commitBlocks]);

  const focused = blocks[focusedIndex];

  // ─── Toolbar buttons ─────────────────────────────────────────────────────

  const isActive = (key: keyof InlineStyle) => !!focused?.styles[key];
  const isType = (t: BlockType, level?: number) => {
    if (!focused) return false;
    if (level !== undefined) return focused.type === t && (focused.props.level as number) === level;
    return focused.type === t;
  };

  const toolbarBg = '#f8fafc';
  const activeBg = '#e0e7ff';
  const activeColor = '#6366f1';
  const inactiveColor = '#64748b';

  function ToolBtn({
    icon,
    active,
    onPress,
    label,
  }: {
    icon: (c: string) => React.ReactNode;
    active?: boolean;
    onPress: () => void;
    label: string;
  }) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: active ? activeBg : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon(active ? activeColor : inactiveColor)}
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Editable area */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <TextInput
          placeholder="Title"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={onTitleChange}
          multiline={false}
          onFocus={() => setFocusedIndex(-1)}
          style={{
            fontSize: 28,
            fontWeight: '800',
            lineHeight: 36,
            marginBottom: 16,
            color: undefined,
          }}
        />

        {/* Blocks */}
        {blocks.map((block, i) => (
          <BlockInput
            key={block.id}
            block={block}
            isFocused={i === focusedIndex}
            onFocus={() => setFocusedIndex(i)}
            onChange={text => updateBlock(i, { text })}
            onEnter={() => insertBlockAfter(i)}
            onBackspace={() => {
              if (block.type !== 'paragraph') {
                updateBlock(i, { type: 'paragraph', props: {} });
              } else {
                removeBlock(i);
              }
            }}
          />
        ))}
        <Pressable onPress={() => insertBlockAfter(blocks.length - 1)} style={{ height: 120 }} />
      </ScrollView>

      {/* Formatting Toolbar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View
          style={{
            backgroundColor: toolbarBg,
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            paddingHorizontal: 8,
            paddingVertical: 6,
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Block type */}
          <ToolBtn label="Paragraph" active={isType('paragraph')} onPress={() => changeType('paragraph')} icon={c => <Type size={16} color={c} />} />
          <ToolBtn label="H1" active={isType('heading', 1)} onPress={() => changeType('heading', { level: 1 })} icon={c => <Heading1 size={16} color={c} />} />
          <ToolBtn label="H2" active={isType('heading', 2)} onPress={() => changeType('heading', { level: 2 })} icon={c => <Heading2 size={16} color={c} />} />
          <ToolBtn label="H3" active={isType('heading', 3)} onPress={() => changeType('heading', { level: 3 })} icon={c => <Heading3 size={16} color={c} />} />
          <ToolBtn label="Bullet" active={isType('bulletListItem')} onPress={() => changeType('bulletListItem')} icon={c => <List size={16} color={c} />} />
          <ToolBtn label="Numbered" active={isType('numberedListItem')} onPress={() => changeType('numberedListItem')} icon={c => <ListOrdered size={16} color={c} />} />
          <ToolBtn label="Checklist" active={isType('checkListItem')} onPress={() => changeType('checkListItem', { checked: false })} icon={c => <ListChecks size={16} color={c} />} />
          <ToolBtn label="Code" active={isType('codeBlock')} onPress={() => changeType('codeBlock')} icon={c => <Code size={16} color={c} />} />

          {/* Divider */}
          <View style={{ width: 1, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 4 }} />

          {/* Inline styles */}
          <ToolBtn label="Bold" active={isActive('bold')} onPress={() => toggleStyle('bold')} icon={c => <Bold size={16} color={c} />} />
          <ToolBtn label="Italic" active={isActive('italic')} onPress={() => toggleStyle('italic')} icon={c => <Italic size={16} color={c} />} />
          <ToolBtn label="Underline" active={isActive('underline')} onPress={() => toggleStyle('underline')} icon={c => <Underline size={16} color={c} />} />
          <ToolBtn label="Strike" active={isActive('strikethrough')} onPress={() => toggleStyle('strikethrough')} icon={c => <Strikethrough size={16} color={c} />} />

          {/* Divider */}
          <View style={{ width: 1, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 4 }} />

          {/* Delete block */}
          <ToolBtn
            label="Delete block"
            onPress={() => {
              if (blocks.length > 1 && focusedIndex >= 0) removeBlock(focusedIndex);
            }}
            icon={c => <Trash2 size={16} color="#ef4444" />}
          />
          {/* Add block */}
          <ToolBtn
            label="Add block"
            onPress={() => insertBlockAfter(focusedIndex >= 0 ? focusedIndex : blocks.length - 1)}
            icon={c => <Plus size={16} color={c} />}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

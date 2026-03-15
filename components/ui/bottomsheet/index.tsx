'use client';

import { FocusScope } from '@gluestack-ui/utils/aria';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Overlay } from '@gluestack-ui/core/overlay/creator';
import GorhomBottomSheet, {
  BottomSheetBackdrop as GorhomBottomSheetBackdrop,
  BottomSheetFlatList as GorhomBottomSheetFlatList,
  BottomSheetFooter as GorhomBottomSheetFooter,
  BottomSheetHandle as GorhomBottomSheetHandle,
  BottomSheetTextInput as GorhomBottomSheetInput,
  BottomSheetScrollView as GorhomBottomSheetScrollView,
  BottomSheetSectionList as GorhomBottomSheetSectionList,
  BottomSheetView as GorhomBottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PressableProps, TextInputProps, TextProps } from 'react-native';
import { Keyboard, Platform, Text, View, useColorScheme } from 'react-native';
import { Pressable } from 'react-native';


const bottomSheetContentStyle = tva({
  base: 'px-4 gap-2',
});

const bottomSheetTriggerStyle = tva({
  base: 'p-4 rounded-lg border border-border/90',
});

const bottomSheetHandleStyle = tva({
  base: 'py-3 w-full items-center rounded-t-xl',
});

const bottomSheetItemStyle = tva({
  base: 'p-3 flex-row items-center rounded-sm w-full disabled:opacity-40 web:pointer-events-auto disabled:cursor-not-allowed hover:bg-accent/40 active:bg-accent/50 data-[focus=true]:bg-accent/20 web:data-[focus-visible=true]:bg-accent/40',
});
const bottomSheetItemTextStyle = tva({
  base: 'text-foreground font-normal text-sm',
});

const bottomSheetFooterStyle = tva({
  base: 'p-4 border-t border-border/90',
});

const bottomSheetTextInputStyle = tva({
  base: 'flex-1 text-foreground text-sm md:text-sm py-1 placeholder:text-muted-foreground  web:outline-none ios:leading-[0px] web:cursor-text  h-9 w-full flex-row items-center rounded-md border border-border dark:bg-input/30 bg-transparent shadow-xs overflow-hidden px-3 gap-2',
});

type BottomSheetContextValue = {
  visible: boolean;
  bottomSheetRef: React.RefObject<GorhomBottomSheet | null>;
  handleClose: () => void;
  handleNaturalClose: () => void;
  handleOpen: (index?: number) => void;
  snapToIndex: (index: number) => void;
  currentIndex: number;
};

const BottomSheetContext = createContext<BottomSheetContextValue>({
  visible: false,
  bottomSheetRef: { current: null },
  handleClose: () => { },
  handleNaturalClose: () => { },
  handleOpen: () => { },
  snapToIndex: () => { },
  currentIndex: -1,
});

export type BottomSheetRef = {
  open: (index?: number) => void;
  close: () => void;
  snapToIndex: (index: number) => void;
  expand: () => void;
  collapse: () => void;
};

type IBottomSheetRootProps = {
  defaultSnapIndex?: number;
  children?: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  onChange?: (index: number, position?: number, type?: any) => void;
};

export const BottomSheet = forwardRef<BottomSheetRef, IBottomSheetRootProps>(
  ({ defaultSnapIndex = 0, onOpen, onClose, onChange, children }, ref) => {
    const bottomSheetRef = useRef<GorhomBottomSheet>(null);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const handleOpen = useCallback(
      (index?: number) => {
        const targetIndex = index ?? defaultSnapIndex;
        bottomSheetRef.current?.snapToIndex(targetIndex);
        setVisible(true);
        setCurrentIndex(targetIndex);
        onOpen?.();
      },
      [defaultSnapIndex, onOpen]
    );

    const handleClose = useCallback(() => {
      Keyboard.dismiss();
      bottomSheetRef.current?.close();
    }, []);

    const handleNaturalClose = useCallback(() => {
      Keyboard.dismiss();
      setVisible(false);
      setCurrentIndex(-1);
      onClose?.();
    }, [onClose]);

    const snapToIndex = useCallback((index: number) => {
      bottomSheetRef.current?.snapToIndex(index);
      setCurrentIndex(index);
    }, []);

    const expand = useCallback(() => {
      bottomSheetRef.current?.expand();
    }, []);

    const collapse = useCallback(() => {
      bottomSheetRef.current?.collapse();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        open: handleOpen,
        close: handleClose,
        snapToIndex,
        expand,
        collapse,
      }),
      [handleOpen, handleClose, snapToIndex, expand, collapse]
    );

    const contextValue = useMemo(
      () => ({
        visible,
        bottomSheetRef,
        handleClose,
        handleNaturalClose,
        handleOpen,
        snapToIndex,
        currentIndex,
      }),
      [
        visible,
        handleClose,
        handleNaturalClose,
        handleOpen,
        snapToIndex,
        currentIndex,
      ]
    );

    return (
      <BottomSheetContext.Provider value={contextValue}>
        {children}
      </BottomSheetContext.Provider>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

type IBottomSheetPortalProps = Omit<
  React.ComponentProps<typeof GorhomBottomSheet>,
  'ref' | 'onChange'
> & {
  snapPoints: (string | number)[];
  className?: string;
  backgroundClassName?: string;
  handleIndicatorClassName?: string;
  enableDynamicSizing?: boolean;
  closeOnBackdropPress?: boolean;
  onChange?: (index: number, position?: number, type?: any) => void;
};

const StyledGorhomBottomSheet = styled(GorhomBottomSheet, {
  className: 'style',
});

export const BottomSheetPortal = ({
  snapPoints,
  handleComponent,
  backdropComponent,
  footerComponent,
  className,
  backgroundClassName,
  handleIndicatorClassName,
  index = -1,
  enablePanDownToClose = true,
  enableDynamicSizing = false,
  closeOnBackdropPress = true,
  onChange,
  ...props
}: IBottomSheetPortalProps) => {
  const { bottomSheetRef, handleNaturalClose } = useContext(BottomSheetContext);
  const colorScheme = useColorScheme();

  const handleSheetChanges = useCallback(
    (idx: number, position?: number, type?: any) => {
      onChange?.(idx, position, type);
      if (idx === -1) {
        handleNaturalClose();
      }
    },
    [handleNaturalClose, onChange]
  );

  return (
    <Overlay isOpen={true} isKeyboardDismissable={false} style={{ flex: 1 }}>
      <StyledGorhomBottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={index}
        backdropComponent={backdropComponent}
        handleComponent={handleComponent}
        footerComponent={footerComponent}
        // @ts-ignore - Handle library version variations in onChange signature
        onChange={handleSheetChanges}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{
          backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? '#2e2e2e' : '#e5e5e5',
        }}
        handleIndicatorStyle={{
          backgroundColor: colorScheme === 'dark' ? '#ffffff' : '#171717',
          width: 40,
        }}
        {...props}
      >
        {props.children}
      </StyledGorhomBottomSheet>
    </Overlay>
  );
};

export const BottomSheetTrigger = ({
  className,
  index,
  ...props
}: PressableProps & { className?: string; index?: number }) => {
  const { handleOpen } = useContext(BottomSheetContext);
  return (
    <Pressable
      onPress={(e) => {
        props.onPress?.(e);
        handleOpen(index);
      }}
      {...props}
      className={bottomSheetTriggerStyle({ className })}
    >
      {props.children}
    </Pressable>
  );
};

type IBottomSheetBackdropProps = BottomSheetBackdropProps & {
  className?: string;
  opacity?: number;
  appearsOnIndex?: number;
  disappearsOnIndex?: number;
  pressBehavior?: 'none' | 'close' | 'collapse' | number;
};

export const BottomSheetBackdrop = ({
  disappearsOnIndex = -1,
  appearsOnIndex = 0,
  opacity = 0.5,
  className,
  pressBehavior = 'close',
  ...props
}: IBottomSheetBackdropProps) => {
  return (
    <GorhomBottomSheetBackdrop
      disappearsOnIndex={disappearsOnIndex}
      appearsOnIndex={appearsOnIndex}
      opacity={opacity}
      pressBehavior={pressBehavior}
      {...props}
    />
  );
};

export const BottomSheetDragIndicator = ({
  children,
  className,
  indicatorClassName,
  ...props
}: any) => {
  return (
    <GorhomBottomSheetHandle
      {...props}
    >
      {children}
    </GorhomBottomSheetHandle>
  );
};

type IBottomSheetContentProps = React.ComponentProps<
  typeof GorhomBottomSheetView
> & {
  className?: string;
  focusScope?: boolean;
};

const StyledGorhomBottomSheetView = styled(GorhomBottomSheetView);

export const BottomSheetContent = ({
  className,
  focusScope = true,
  ...props
}: IBottomSheetContentProps) => {
  const { handleClose, visible } = useContext(BottomSheetContext);

  const keyDownHandlers = useMemo(() => {
    if (Platform.OS !== 'web') return {};
    return {
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        }
      },
    };
  }, [handleClose]);

  const content = (
    <StyledGorhomBottomSheetView
      {...props}
      {...keyDownHandlers}
      className={bottomSheetContentStyle({ className })}
    >
      {props.children}
    </StyledGorhomBottomSheetView>
  );

  return Platform.OS === 'web' && visible && focusScope ? (
    <FocusScope contain={visible} autoFocus restoreFocus>
      {content}
    </FocusScope>
  ) : (
    content
  );
};

export const BottomSheetFooter = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof GorhomBottomSheetFooter> & { className?: string }) => {
  return (
    <GorhomBottomSheetFooter {...props}>
      <View className={bottomSheetFooterStyle({ className })}>
        {children}
      </View>
    </GorhomBottomSheetFooter>
  );
};

export const BottomSheetItem = ({
  children,
  className,
  closeOnSelect = true,
  ...props
}: PressableProps & { className?: string; closeOnSelect?: boolean }) => {
  const { handleClose } = useContext(BottomSheetContext);

  return (
    <Pressable
      {...props}
      className={bottomSheetItemStyle({ className })}
      onPress={(e) => {
        props.onPress?.(e);
        if (closeOnSelect) {
          handleClose();
        }
      }}
    >
      {children}
    </Pressable>
  );
};

export const BottomSheetItemText = ({
  className,
  ...props
}: TextProps & { className?: string }) => {
  return (
    <Text {...props} className={bottomSheetItemTextStyle({ className })} />
  );
};

export const BottomSheetTextInput = ({
  className,
  ...props
}: TextInputProps & { className?: string }) => {
  return (
    <GorhomBottomSheetInput
      {...props}
      className={bottomSheetTextInputStyle({ className })}
    />
  );
};

export const BottomSheetScrollView = GorhomBottomSheetScrollView;
export const BottomSheetFlatList = GorhomBottomSheetFlatList;
export const BottomSheetSectionList = GorhomBottomSheetSectionList;

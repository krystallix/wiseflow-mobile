import {
  registerWidgetTaskHandler,
  type WidgetTaskHandler,
} from 'react-native-android-widget';
import { CalendarWidget } from './CalendarWidget';

// Task handler — called by the Android OS when widget needs update
// NOTE: In react-native-android-widget v0.20+, widgetName lives inside widgetInfo
const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetInfo,
  widgetAction,
  renderWidget,
}) => {
  if (widgetInfo.widgetName !== 'CalendarWidget') return;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderWidget(<CalendarWidget />);
      break;
    default:
      break;
  }
};

registerWidgetTaskHandler(widgetTaskHandler);

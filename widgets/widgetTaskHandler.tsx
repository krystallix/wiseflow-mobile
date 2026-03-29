import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { CalendarWidget } from './CalendarWidget';

// Task handler — called by the Android OS when widget needs update
async function widgetTaskHandler(props: any) {
  const { widgetAction, widgetName, renderWidget } = props;

  if (widgetName !== 'CalendarWidget') return;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderWidget(<CalendarWidget />);
      break;
    default:
      break;
  }
}

registerWidgetTaskHandler(widgetTaskHandler);

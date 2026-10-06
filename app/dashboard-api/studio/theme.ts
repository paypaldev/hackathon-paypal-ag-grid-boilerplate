// AG Studio theme for the PayPal dashboard. Every value points at a design token from
// app/globals.css, the same variables the shell's Tailwind classes use, so Studio renders as
// part of the page rather than a component embedded in it: change a token there and the shell,
// widgets, grids and charts all follow.

import { studioTheme } from 'ag-studio';

const token = (name: string) => `var(--pp-${name})`;
const line = (color: string) => ({ width: 1, color: token(color) });

const palette = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [
    [`chartPaletteFills${i + 1}Color`, token(`chart-${i + 1}`)],
    [`chartPaletteStrokes${i + 1}Color`, token(`chart-${i + 1}`)],
  ]).flat(),
);

export const paypalStudioTheme = studioTheme.withParams({
  // Shared by Studio's UI, grids and charts.
  fontFamily: token('font'),
  fontSize: 14,
  textColor: token('ink'),
  foregroundColor: token('ink'),
  subtleTextColor: token('muted'),
  backgroundColor: token('surface'),
  borderColor: token('border'),
  accentColor: token('blue'),
  iconColor: token('navy'),
  rowHoverColor: token('highlight'),

  // No frame: the canvas is the page's own background. Each widget is inset 12px inside its
  // grid cell, so 20px of padding puts widget edges on the header's 32px gutter.
  studioWrapperBorder: false,
  studioWrapperBorderRadius: 0,
  studioWrapperSpacing: 0,
  studioWrapperBackgroundColor: token('canvas'),
  studioCanvasBorder: false,
  studioCanvasBorderRadius: 0,
  studioCanvasShadow: false,
  studioCanvasBackgroundColor: token('canvas'),
  studioCanvasPadding: 20,
  // Slightly taller rows than the default 16px make room for card padding.
  studioCanvasRowHeight: 18,
  studioCanvasFontFamily: token('font'),

  // Widgets are the shell's cards: white, 1px border, 8px radius.
  studioWidgetBackgroundColor: token('surface'),
  studioWidgetBorder: line('border'),
  studioWidgetBorderRadius: 8,
  studioWidgetPadding: 10,
  studioWidgetTitleFontFamily: token('font'),
  studioWidgetTitleFontSize: 16,
  studioWidgetTitleFontWeight: 600,
  studioWidgetTitleTextColor: token('navy'),
  studioWidgetSubtitleFontFamily: token('font'),
  studioWidgetSubtitleFontSize: 13,
  studioWidgetSubtitleTextColor: token('muted'),
  studioWidgetCaptionFontFamily: token('font'),
  studioWidgetCaptionFontSize: 13,
  studioWidgetCaptionTextColor: token('muted'),
  studioWidgetResizeBorderColor: token('blue'),

  // Edit-mode panels read as more of the sidebar.
  studioPanelContainerBackgroundColor: token('surface'),
  studioPanelContainerBorder: line('border'),
  studioPanelContainerBorderRadius: 0,
  studioPanelDividerColor: token('border'),
  studioPanelDividerActiveColor: token('blue'),
  studioPanelSectionBorderColor: token('border'),
  studioPanelHeaderFontFamily: token('font'),
  studioPanelHeaderFontWeight: 600,
  studioPanelChevronButtonHoverBackgroundColor: token('highlight'),
  studioPanelChevronButtonHoverColor: token('blue'),
  // Selected toggles match the sidebar's selected item: highlight fill, blue text and edge.
  studioToggleButtonActiveBackgroundColor: token('highlight'),
  studioToggleButtonActiveBorderColor: token('blue'),
  studioToggleButtonActiveColor: token('blue'),

  // Grid widgets: muted semibold headers, light dividers, roomy rows.
  gridFontFamily: token('font'),
  gridFontSize: 14,
  gridCellTextColor: token('ink'),
  gridHeaderBackgroundColor: token('surface'),
  gridHeaderTextColor: token('muted'),
  gridHeaderFontWeight: 600,
  gridHeaderFontSize: 13,
  gridRowHeight: 40,
  gridRowBorder: line('gridline'),
  gridHeaderRowBorder: line('border'),
  gridPinnedRowBorder: line('border'),
  gridRowHoverColor: token('highlight'),
  gridWrapperBorder: false,

  // Charts.
  chartFontFamily: token('font'),
  chartTextColor: token('ink'),
  chartSubtleTextColor: token('muted'),
  chartAxisLineColor: token('border'),
  chartGridLineColor: token('gridline'),
  ...palette,
});

/*
 * Helpers for building AG Studio report state in ../initialState.ts.
 */

// AG Studio types for report state.
import type { AgWidgetLayoutState } from 'ag-studio';

// Wrappers for common report options, to simplify report state + ensure consistent style across all widgets.
export const at = (
  xTrack: number,
  yTrack: number,
  xSpan: number,
  ySpan: number,
): AgWidgetLayoutState => ({ xTrack, yTrack, xSpan, ySpan });
export const title = (text: string) => ({ title: { enabled: true, text } });
export const sum = (id: string) => ({ id, aggregation: 'sum' as const });
export const avg = (id: string) => ({ id, aggregation: 'avg' as const });
export const countd = (id: string) => ({ id, aggregation: 'countd' as const });

// Default, ordered list of preferred fonts to use within all widgets.
const PAYPAL_FONT =
  '"PayPal Open", "Helvetica Neue", Helvetica, Arial, sans-serif';

// Const default typography for all widgets, using the PAYPAL_FONT list.
export const typography = (
  fontSize: number,
  fontWeight: 'normal' | 'bold' = 'normal',
) => ({
  fontFamily: PAYPAL_FONT,
  fontSize,
  fontWeight,
  fontStyle: 'normal' as const,
});

// Wrapper for KPI widget format, to simplify report state + ensure KPIs share a consistent style.
export const kpi = (
  text: string,
  value: { id: string; aggregation?: 'sum' | 'avg' | 'countd' },
  sparklineX?: string,
) => ({
  type: 'value' as const,
  dataMapping: {
    value: [value],
    ...(sparklineX && { sparklineX: [{ id: sparklineX }] }),
  },
  format: {
    title: { enabled: true, text, typography: typography(14, 'bold') },
    caption: { enabled: true, text: '', typography: typography(0) },
    style: { typography: typography(22) },
  },
});

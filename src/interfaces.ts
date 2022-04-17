export enum MENU_OPTIONS {
  FILE = 'File',
  EDIT = 'Edit',
  VIEW = 'View',
  ABOUT = 'About',
  UNSET = '',
}
export enum APP_BAR_BUTTONS {
  MAXIMIZE = 'MAXIMIZE',
  MINIMIZE = 'MINIMIZE',
  CLOSE = 'CLOSE',
}
export type APP_BAR_BUTTONS_TYPE = 'MAXIMIZE' | 'MINIMIZE' | 'CLOSE';

export type MENU_OPTION_TYPE = 'File' | 'Edit' | 'View' | 'About' | '';

export type Shapes = 'RECTANGLE' | 'DIAMOND' | 'LINE' | 'CIRCLE';

export type POINT_TYPE = (undefined | number)[];
export type FILLED_POINT_TYPE = [number, number];
export type UNDEFINED_POINT_TYPE = [undefined, undefined];

export interface CIRCLE_BOUNDS_PROPS extends BOUNDS_PROPS {
  radius: number | 0;
  area?: number | 0;
}
export interface LINE_BOUNDS_PROPS extends BOUNDS_PROPS {
  angle?: number;
}

export interface BOUNDS_PROPS {
  width?: number | undefined;
  height?: number | undefined;
  initialPoint: POINT_TYPE;
  finalPoint: POINT_TYPE;
}

export enum ShapesEnum {
  LINE = 'LINE',
  CIRCLE = 'CIRCLE',
  RECTANGLE = 'RECTANGLE',
  DIAMOND = 'DIAMOND',
}

export enum TOOL_OPTIONS {
  BRUSH_SIZE_PICKER = 'BRUSH_SIZE_PICKER',
  LINE = 'LINE',
  CIRCLE = 'CIRCLE',
  RECTANGLE = 'RECTANGLE',
  DIAMOND = 'DIAMOND',
  SELECT_BOX = 'SELECT_BOX',
  NONE = 'NONE',
}
export type TOOL_OPTIONS_TYPE =
  | 'NONE'
  | 'BRUSH_SIZE_PICKER'
  | 'SELECT_BOX'
  | 'LINE'
  | 'CIRCLE'
  | 'RECTANGLE'
  | 'DIAMOND';

export interface WINDOW_EVENT_SWITCH_ROUTE_PROPS {
  route: string;
}
export interface EVENT_CONTEXT_MENU_PROPS {
  x: number;
  y: number;
}
export interface EVENT_CONTEXT_MENU_PROPS_WITH_TYPE {
  x: number;
  y: number;
  type: MENU_OPTION_TYPE;
}

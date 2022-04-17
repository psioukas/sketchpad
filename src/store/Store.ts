import { reaction } from 'mobx';
import { Instance, SnapshotOut, types } from 'mobx-state-tree';
import { Circle, Line, Rectangle } from 'renderer/utils/ShapeFunctions';
import { v4 as uuid } from 'uuid';
import { BOUNDS_PROPS, TOOL_OPTIONS, TOOL_OPTIONS_TYPE } from './../interfaces';

const EntitiesStore = types.model({
  id: types.string,
  entity: types.string,
  type: types.union(
    types.literal(TOOL_OPTIONS.CIRCLE),
    types.literal(TOOL_OPTIONS.RECTANGLE),
    types.literal(TOOL_OPTIONS.LINE)
  ),
  styles: types.array(types.string),
  // circles: types.array(
  //   types.model({
  //     id: types.string,
  //     entity: types.string,
  //     type: TOOL_OPTIONS.CIRCLE,
  //     styles: types.array(types.string),
  //   })
  // ),
  // rectangles: types.array(
  //   types.model({
  //     id: types.string,
  //     entity: types.string,
  //     type: TOOL_OPTIONS.RECTANGLE,
  //     styles: types.array(types.string),
  //   })
  // ),
  // lines: types.array(
  //   types.model({
  //     id: types.string,
  //     entity: types.string,
  //     type: TOOL_OPTIONS.LINE,
  //     styles: types.array(types.string),
  //   })
  // ),
});

export type EntitiesStoreType = Instance<typeof EntitiesStore>;
export interface IEntity extends SnapshotOut<typeof EntitiesStore>{}
export type EntitiesType =
   (CircleEntitiesType
  | RectangleEntitiesType
  | LineEntitiesType) [];
export type CircleEntitiesType = {
  id: string;
  entity: string;
  type: TOOL_OPTIONS.CIRCLE;
};
export type RectangleEntitiesType = {
  id: string;
  entity: string;
  type: TOOL_OPTIONS.RECTANGLE;
};
export type LineEntitiesType = {
  id: string;
  entity: string;
  type: TOOL_OPTIONS.LINE;
};
export const ToolStore = types
  .model({
    current: types.optional(types.string, TOOL_OPTIONS.LINE),
    previous: types.optional(types.string, TOOL_OPTIONS.LINE),
    tools: types.array(types.string),
    displayBrush: types.optional(types.boolean, false),
    clicks: types.optional(types.number, 0),
    maxClicksAllowed: types.optional(types.number, 0),
    elements: types.optional(types.array(EntitiesStore), []),
  })
  .views((self) => ({
    getFirstTool: () => {
      return self.tools[0];
    },
    getCurrentToolIndex: () => {
      return self.tools.findIndex((tool) => tool === self.current);
    },
    getLastTool: () => {
      return self.tools[self.tools.length - 1];
    },
    noOfTools: () => self.tools.length,
    shouldFinishDraw: () => self.maxClicksAllowed <= self.clicks,
  }))
  .actions((self) => ({
    setTool: (tool: TOOL_OPTIONS_TYPE) => {
      self.previous = self.current;
      if (tool === TOOL_OPTIONS.NONE || tool === TOOL_OPTIONS.BRUSH_SIZE_PICKER)
        return;
      self.current = tool;
    },
    setPrevious: (tool: TOOL_OPTIONS_TYPE) => {
      self.previous = tool;
    },
    toggleDisplayBrush: () => {
      self.displayBrush = !self.displayBrush;
    },
    clearTool: () => {
      self.previous = self.current;
      self.current = TOOL_OPTIONS.NONE;
    },
    cycleUp: () => {
      const index = self.getCurrentToolIndex();
      self.previous = self.current;
      if (index < self.noOfTools()) {
        self.current = self.tools[index + 1];
      } else {
        self.current = self.getFirstTool();
      }
    },
    cycleDown: () => {
      const index = self.getCurrentToolIndex();
      self.previous = self.current;
      if (index > 0) {
        self.current = self.tools[index - 1];
      } else {
        self.current = self.getLastTool();
      }
    },
    addElement: (element: string, elementType: TOOL_OPTIONS_TYPE) => {
      switch (elementType) {
        case TOOL_OPTIONS.CIRCLE:
          self.elements.push({
            id: uuid(),
            entity: element,
            type: TOOL_OPTIONS.CIRCLE,
          });
          break;
        case TOOL_OPTIONS.RECTANGLE:
          self.elements.push({
            id: uuid(),
            entity: element,

            type: TOOL_OPTIONS.RECTANGLE,
          });
          break;
        case TOOL_OPTIONS.LINE:
          self.elements.push({
            id: uuid(),
            entity: element,
            type: TOOL_OPTIONS.LINE,
          });
          break;
        default:
          break;
      }
    },
    findSelectionElements: (
      bounds: BOUNDS_PROPS
    ): { unSelected: IEntity[]; selected: IEntity[] } => {
        let unSelected: IEntity[] = [];
        let selected: IEntity[] = [];
      self.elements.forEach((item:IEntity) => {
        let entityInBounds = false;
        switch (item.type) {
          case TOOL_OPTIONS.CIRCLE:
            entityInBounds = Circle.checkIfInBounds(bounds, item.entity);
            break;
          case TOOL_OPTIONS.RECTANGLE:
            entityInBounds = Rectangle.checkIfInBounds(bounds, item.entity);
            break;
          case TOOL_OPTIONS.LINE:
            entityInBounds = Line.checkIfInBounds(bounds, item.entity);
            break;
          default:
            break;
        }
        entityInBounds ? selected.push(item) : unSelected.push(item);
      });
      return {
        unSelected,
        selected
      }
    },
    setMaxClicks: (numOfClicks: number) => {
      self.maxClicksAllowed = numOfClicks;
    },
    incrementClicks: () => {
      self.clicks++;
    },
    resetClicks: () => {
      self.clicks = 0;
    },
  }))
  .create({
    current: TOOL_OPTIONS.LINE,
    previous: TOOL_OPTIONS.LINE,
    maxClicksAllowed: 0,
    tools: Array.from(
      Object.values(TOOL_OPTIONS)
        .filter(
          (value) =>
            value !== TOOL_OPTIONS.BRUSH_SIZE_PICKER &&
            value !== TOOL_OPTIONS.NONE
        )
        .map((value: string) => value)
    ),
  });
reaction(
  () => ToolStore.current,
  () => {
    let maxClicks = 2;
    ToolStore.setMaxClicks(maxClicks);
  }
);
type ToolStoreType = typeof ToolStore;

interface ToolStoreTypeInterface extends ToolStoreType {}
export interface ToolStoreInterface extends Instance<ToolStoreTypeInterface> {}

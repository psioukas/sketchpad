import { Utils } from 'utils';
import {
  BOUNDS_PROPS,
  CIRCLE_BOUNDS_PROPS,
  FILLED_POINT_TYPE,
  POINT_TYPE,
  TOOL_OPTIONS,
  TOOL_OPTIONS_TYPE,
  UNDEFINED_POINT_TYPE,
} from '../../../interfaces';

interface ICircleProps {
  centerPoint: POINT_TYPE;
  outerPoint: POINT_TYPE;
  drawingOuterPoint: POINT_TYPE;
  renderPreview: (ctx: CanvasRenderingContext2D) => void;
  renderShape: (
    ctx: CanvasRenderingContext2D,
    previewCtx: CanvasRenderingContext2D
  ) => void;
  reset: () => void;
}

const INITIAL_CIRCLE_POINT: UNDEFINED_POINT_TYPE = [undefined, undefined];
const INITIAL_BOUNDS: CIRCLE_BOUNDS_PROPS = {
  initialPoint: INITIAL_CIRCLE_POINT,
  finalPoint: INITIAL_CIRCLE_POINT,
  radius: 0,
  area: 0,
};

class Circle implements ICircleProps {
  type: TOOL_OPTIONS_TYPE = TOOL_OPTIONS.CIRCLE;

  radius: number = 0;

  centerPoint: POINT_TYPE = INITIAL_CIRCLE_POINT;

  outerPoint: POINT_TYPE = INITIAL_CIRCLE_POINT;

  drawingOuterPoint: POINT_TYPE = INITIAL_CIRCLE_POINT;

  shouldRender: boolean = false;

  bounds: CIRCLE_BOUNDS_PROPS = INITIAL_BOUNDS;

  constructor(json?: string) {
    if (json !== undefined) {
      this.parse(json);
    }
  }

  get centerPointSet(): boolean {
    return this.centerPoint.every((p) => p !== undefined && !Number.isNaN(p));
  }

  get drawingOuterPointSet(): boolean {
    return this.drawingOuterPoint.every(
      (p: number | undefined) => p && !Number.isNaN(p)
    );
  }

  get outerPointSet(): boolean {
    return this.outerPoint.every((p) => p !== undefined && !Number.isNaN(p));
  }

  get readyToRender(): boolean {
    return this.shouldRender;
  }

  set setReadyToRender(ready: boolean) {
    this.shouldRender = ready;
  }

  static checkIfInBounds(
    boundingBoxBounds: BOUNDS_PROPS,
    entityJson: string
  ): boolean {
    const circleBounds = Utils.convertCircularBoundsToRectangular(
      new Circle(entityJson).getBounds()
    );
    return Utils.checkIfWithinBounds(boundingBoxBounds, circleBounds);
  }

  renderShape(
    ctx: CanvasRenderingContext2D,
    previewCtx: CanvasRenderingContext2D
  ): string {
    // save context styles.
    ctx.save();
    previewCtx.save();
    // clear preview

    previewCtx.clearRect(
      0,
      0,
      previewCtx.canvas.width,
      previewCtx.canvas.height
    );
    // render circle
    this.drawShape(ctx);
    ctx.restore();
    previewCtx.restore();
    // return Entity in string form.
    const entityJson = this.json();
    this.#resetProperties();
    return entityJson;
  }

  renderPreview(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.drawShape(ctx, true);
    this.drawingOuterPoint = INITIAL_CIRCLE_POINT;
  }

  setCenterPoint = (x: number, y: number) => {
    this.centerPoint = [x, y];
  };

  setDrawingOuterPoint = (x: number, y: number) => {
    this.drawingOuterPoint = [x, y];
  };

  setOuterPoint = (x: number, y: number) => {
    const centerPoint: FILLED_POINT_TYPE = this
      .centerPoint as FILLED_POINT_TYPE;
    const outerPoint: FILLED_POINT_TYPE = [x, y];
    this.bounds = {
      initialPoint: centerPoint,
      finalPoint: outerPoint,
      radius: Math.sqrt(
        Math.abs(centerPoint[0] - outerPoint[0]) ** 2 +
          Math.abs(centerPoint[1] - outerPoint[1]) ** 2
      ),
      area: Math.PI * this.bounds.radius ** 2,
    };

    this.outerPoint = outerPoint;
  };

  reset() {
    this.#resetProperties();
  }

  parse(jsonEntity: string) {
    const object: Circle = JSON.parse(jsonEntity);
    Object.assign(this, object);
  }

  json(): string {
    return JSON.stringify(this, null, 2);
  }

  drawShape(ctx: CanvasRenderingContext2D, isPreview?: boolean): void {
    const centerPoint = this.centerPoint as [number, number];
    const outerPoint = (
      isPreview ? this.drawingOuterPoint : this.outerPoint
    ) as [number, number];
    this.radius = Math.sqrt(
      Math.abs(centerPoint[0] - outerPoint[0]) ** 2 +
        Math.abs(centerPoint[1] - outerPoint[1]) ** 2
    );

    ctx.beginPath();
    ctx.arc(centerPoint[0], centerPoint[1], this.radius, 0, 2 * Math.PI, true);
    ctx.stroke();
  }

  getBounds() {
    return this.bounds;
  }

  #resetProperties() {
    this.radius = 0;
    this.centerPoint = INITIAL_CIRCLE_POINT;
    this.outerPoint = INITIAL_CIRCLE_POINT;
    this.drawingOuterPoint = INITIAL_CIRCLE_POINT;
    this.setReadyToRender = false;
    this.bounds = INITIAL_BOUNDS;
  }
}

export default Circle;

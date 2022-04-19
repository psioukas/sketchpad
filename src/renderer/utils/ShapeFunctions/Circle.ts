import { Utils } from 'utils';
import {
  BOUNDS_PROPS,
  CIRCLE_BOUNDS_PROPS,
  FILLED_POINT_TYPE,
  POINT_TYPE,
  TOOL_OPTIONS,
  TOOL_OPTIONS_TYPE,
  UNDEFINED_POINT_TYPE,
} from './../../../interfaces';

interface ICircleProps {
  _centerPoint: POINT_TYPE;
  _outerPoint: POINT_TYPE;
  _drawingOuterPoint: POINT_TYPE;
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
  _radius: number = 0;
  _centerPoint: POINT_TYPE = INITIAL_CIRCLE_POINT;
  _outerPoint: POINT_TYPE = INITIAL_CIRCLE_POINT;
  _drawingOuterPoint: POINT_TYPE = INITIAL_CIRCLE_POINT;
  _shouldRender: boolean = false;
  bounds: CIRCLE_BOUNDS_PROPS = INITIAL_BOUNDS;

  renderShape(
    ctx: CanvasRenderingContext2D,
    previewCtx: CanvasRenderingContext2D
  ): string {
    //save context styles.
    ctx.save();
    previewCtx.save();
    //clear preview
    console.log({ctx})
    previewCtx.clearRect(
      0,
      0,
      previewCtx.canvas.width,
      previewCtx.canvas.height
    );
    //render circle
    this.drawShape(ctx);
    ctx.restore();
    previewCtx.restore();
    //return stringified Entity
    const entityJson = this.json();
    this.#resetProperties();
    return entityJson;
  }

  renderPreview(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.drawShape(ctx, true);
    this._drawingOuterPoint = INITIAL_CIRCLE_POINT;
  }

  get centerPointSet(): boolean {
    return this._centerPoint.every((p: number | undefined) => p && !isNaN(p));
  }

  get drawingOuterPointSet(): boolean {
    return this._drawingOuterPoint.every(
      (p: number | undefined) => p && !isNaN(p)
    );
  }

  get outerPointSet(): boolean {
    return this._outerPoint.every((p: number | undefined) => p && !isNaN(p));
  }
  get readyToRender(): boolean {
    return this._shouldRender;
  }

  set setReadyToRender(ready: boolean) {
    this._shouldRender = ready;
  }

  setCenterPoint = (x: number, y: number) => {
    this._centerPoint = [x, y];
  };

  setDrawingOuterPoint = (x: number, y: number) => {
    this._drawingOuterPoint = [x, y];
  };

  setOuterPoint = (x: number, y: number) => {
    let centerPoint: FILLED_POINT_TYPE = this._centerPoint as FILLED_POINT_TYPE;
    let outerPoint: FILLED_POINT_TYPE = [x, y];
    this.bounds = {
      initialPoint: centerPoint,
      finalPoint: outerPoint,
      radius: Math.sqrt(
        Math.abs(centerPoint[0] - outerPoint[0]) ** 2 +
          Math.abs(centerPoint[1] - outerPoint[1]) ** 2
      ),
      area: Math.PI * this.bounds.radius ** 2,
    };

    this._outerPoint = outerPoint;
  };

  #resetProperties(): Promise<void> {
    return new Promise((resolve) => {
      this._radius = 0;
      this._centerPoint = INITIAL_CIRCLE_POINT;
      this._outerPoint = INITIAL_CIRCLE_POINT;
      this._drawingOuterPoint = INITIAL_CIRCLE_POINT;
      this.setReadyToRender = false;
      this.bounds = INITIAL_BOUNDS;
      resolve();
    });
  }

  async reset() {
    await this.#resetProperties();
  }

  async parse(jsonEntity: string) {
    const object: Circle = JSON.parse(jsonEntity);
    Object.assign(this, object);
  }

  json(): string {
    return JSON.stringify(this, null, 2);
  }

  drawShape(ctx: CanvasRenderingContext2D, isPreview?: boolean): void {
    let centerPoint = this._centerPoint as [number, number];
    let outerPoint = (
      isPreview ? this._drawingOuterPoint : this._outerPoint
    ) as [number, number];
    this._radius = Math.sqrt(
      Math.abs(centerPoint[0] - outerPoint[0]) ** 2 +
        Math.abs(centerPoint[1] - outerPoint[1]) ** 2
    );

    ctx.beginPath();
    ctx.arc(centerPoint[0], centerPoint[1], this._radius, 0, 2 * Math.PI, true);
    ctx.stroke();
  }

  static checkIfInBounds(boundingBoxBounds: BOUNDS_PROPS, entityJson: string): boolean {
    let circleBounds = Utils.convertCircularBoundsToRectangular(
      new Circle(entityJson).getBounds()
    );
    return Utils.checkIfWithinBounds(boundingBoxBounds,circleBounds)
  }
  getBounds() {
    return this.bounds;
  }
  constructor(json?:string) {
    json && this.parse(json);
  }
}

export default Circle;

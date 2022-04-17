import {
  BOUNDS_PROPS,
  FILLED_POINT_TYPE,
  POINT_TYPE,
  TOOL_OPTIONS,
  TOOL_OPTIONS_TYPE,
} from './../../../interfaces';

interface IRectangleProps {
  _initialPoint: POINT_TYPE;
  _finalPoint: POINT_TYPE;
  _drawingFinalPoint: POINT_TYPE;
  renderPreview: (ctx: CanvasRenderingContext2D) => void;
  renderShape: (
    ctx: CanvasRenderingContext2D,
    previewCtx: CanvasRenderingContext2D
  ) => void;
  reset: () => void;
}
const RESET_POINT: [undefined, undefined] = [undefined, undefined];
const INITIAL_BOUNDS: BOUNDS_PROPS = {
  width: undefined,
  height: undefined,
  initialPoint: RESET_POINT,
  finalPoint: RESET_POINT,
};
class Rectangle implements IRectangleProps {
  type: TOOL_OPTIONS_TYPE = TOOL_OPTIONS.RECTANGLE;
  _initialPoint: POINT_TYPE = [undefined, undefined];
  _finalPoint: POINT_TYPE = [undefined, undefined];
  _drawingFinalPoint: POINT_TYPE = [undefined, undefined];
  _shouldRender: boolean = false;
  bounds: BOUNDS_PROPS = INITIAL_BOUNDS;

  renderShape(
    ctx: CanvasRenderingContext2D,
    previewCtx: CanvasRenderingContext2D
  ): string {
    //clear preview
    previewCtx.clearRect(
      0,
      0,
      previewCtx.canvas.width,
      previewCtx.canvas.height
    );
    this.drawShape(ctx);
    //save context styles.
    ctx.save();
    previewCtx.save();
    //return stringified Entity
    const entityJson = this.json();
    this.#resetProperties();
    return entityJson;
  }

  renderPreview(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.drawShape(ctx, true);
    this._drawingFinalPoint = RESET_POINT;
  }

  get initialPointSet(): boolean {
    return this._initialPoint.every((p: number | undefined) => p && !isNaN(p));
  }

  get drawingFinalPointSet(): boolean {
    return this._drawingFinalPoint.every(
      (p: number | undefined) => p && !isNaN(p)
    );
  }

  get finalPointSet(): boolean {
    return this._finalPoint.every((p: number | undefined) => p && !isNaN(p));
  }
  get readyToRender(): boolean {
    return this._shouldRender;
  }

  setInitialPoint = (x: number, y: number) => {
    this._initialPoint = [x, y];
  };

  setDrawingFinalPoint = (x: number, y: number) => {
    this._drawingFinalPoint = [x, y];
  };

  setFinalPoint = (x: number, y: number) => {
    let finalPoint: FILLED_POINT_TYPE = [x, y];
    let initialPoint: FILLED_POINT_TYPE = this
      ._initialPoint as FILLED_POINT_TYPE;
    this.bounds = {
      width: Math.abs(finalPoint[0] - initialPoint[0]),
      height: Math.abs(finalPoint[1] - initialPoint[1]),
      initialPoint: initialPoint,
      finalPoint: finalPoint,
    };

    this._finalPoint = finalPoint;
  };

  set setReadyToRender(ready: boolean) {
    this._shouldRender = ready;
  }

  #resetProperties(): Promise<void> {
    return new Promise((resolve) => {
      this._initialPoint = RESET_POINT;
      this._finalPoint = RESET_POINT;
      this._drawingFinalPoint = RESET_POINT;
      this.setReadyToRender = false;
      this.bounds = INITIAL_BOUNDS;
      resolve();
    });
  }

  async reset() {
    await this.#resetProperties();
  }

  async parse(jsonEntity: string) {
    const object: Rectangle = JSON.parse(jsonEntity);
    Object.assign(this, object);
  }

  json(): string {
    return JSON.stringify(this, null, 2);
  }

  drawShape(ctx: CanvasRenderingContext2D, isPreview?: boolean): void {
    let startPoint = this._initialPoint as [number, number];
    let endPoint = (isPreview ? this._drawingFinalPoint : this._finalPoint) as [
      number,
      number
    ];

    ctx.beginPath();
    ctx.rect(
      startPoint[0],
      startPoint[1],
      endPoint[0] - startPoint[0],
      endPoint[1] - startPoint[1]
    );
    ctx.stroke();
  }
  static checkIfInBounds(bounds: BOUNDS_PROPS, entityJson: string): boolean {
    let entityBounds = new Rectangle(entityJson).getBounds();
    let [boundsFP, boundsIP, entityFP, entityIP] = [
      bounds.finalPoint as FILLED_POINT_TYPE,
      bounds.initialPoint as FILLED_POINT_TYPE,
      entityBounds.finalPoint as FILLED_POINT_TYPE,
      entityBounds.initialPoint as FILLED_POINT_TYPE,
    ];
    let boxCoords = {
      left: Math.min(boundsIP[0], boundsFP[0]),
      right: Math.max(boundsIP[0], boundsFP[0]),
      top: Math.min(boundsIP[1], boundsFP[1]),
      bottom: Math.max(boundsIP[1], boundsFP[1]),
    };
    let entityCoords = {
      left: Math.min(entityIP[0], entityFP[0]),
      right: Math.max(entityIP[0], entityFP[0]),
      top: Math.min(entityIP[1], entityFP[1]),
      bottom: Math.max(entityIP[1], entityFP[1]),
    };
    // check horizontal axis bounds
    if (
      entityCoords.left < boxCoords.left ||
      entityCoords.right > boxCoords.right
    )
      return false;
    // check vertical axis bounds
    if (
      entityCoords.top < boxCoords.top ||
      entityCoords.bottom > boxCoords.bottom
    )
      return false;
    return true;
  }
  getBounds() {
    return this.bounds;
  }
  constructor(json?: string) {
    if (json && json.length > 0) this.parse(json);
  }
}
export default Rectangle;

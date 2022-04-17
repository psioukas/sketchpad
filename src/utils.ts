import {
  BOUNDS_PROPS,
  CIRCLE_BOUNDS_PROPS,
  FILLED_POINT_TYPE,
  TOOL_OPTIONS,
} from 'interfaces';
import { Circle, Line, Rectangle } from 'renderer/utils/ShapeFunctions';
import { LINE_BOUNDS_PROPS } from './interfaces';
import { IEntity } from './store/Store';

type BOX_POINTS = {
  start: FILLED_POINT_TYPE;
  end: FILLED_POINT_TYPE;
};

export class Utils {
  static convertLineBoundsToRectangular(
    lBounds: LINE_BOUNDS_PROPS
  ): BOUNDS_PROPS {
    let rectBounds: BOUNDS_PROPS = {
      width: undefined,
      height: undefined,
      initialPoint: [undefined, undefined],
      finalPoint: [undefined, undefined],
    };
    const lineBounds = {
      width: lBounds.width,
      height: lBounds.height,
      initialPoint: lBounds.initialPoint as FILLED_POINT_TYPE,
      finalPoint: lBounds.finalPoint as FILLED_POINT_TYPE,
    };

    rectBounds = {
      width:
        lineBounds.width ??
        Math.abs(lineBounds.initialPoint[0] - lineBounds.finalPoint[0]),
      height:
        lineBounds.height ??
        Math.abs(lineBounds.initialPoint[0] - lineBounds.finalPoint[0]),
      initialPoint: lineBounds.initialPoint,
      finalPoint: lineBounds.finalPoint,
    };
    return rectBounds;
  }

  static convertCircularBoundsToRectangular(
    cBounds: CIRCLE_BOUNDS_PROPS
  ): BOUNDS_PROPS {
    let rectBounds: BOUNDS_PROPS = {
      width: undefined,
      height: undefined,
      initialPoint: [undefined, undefined],
      finalPoint: [undefined, undefined],
    };

    let centerPoint = cBounds.initialPoint as FILLED_POINT_TYPE;

    rectBounds.initialPoint = [
      centerPoint[0] - cBounds.radius,
      centerPoint[1] - cBounds.radius,
    ];
    rectBounds.finalPoint = [
      centerPoint[0] + cBounds.radius,
      centerPoint[1] + cBounds.radius,
    ];
    rectBounds.width = rectBounds.height = cBounds.radius * 2;
    return rectBounds;
  }

  static checkIfWithinBounds(
    boundingBoxBounds: BOUNDS_PROPS,
    testBounds: BOUNDS_PROPS
  ) {
    const boundingBoxPoints: BOX_POINTS = {
      start: boundingBoxBounds.initialPoint as FILLED_POINT_TYPE,
      end: boundingBoxBounds.finalPoint as FILLED_POINT_TYPE,
    };

    const testPoints: BOX_POINTS = {
      start: testBounds.initialPoint as FILLED_POINT_TYPE,
      end: testBounds.finalPoint as FILLED_POINT_TYPE,
    };
    // translate to box rect coordinates
    const boundingBoxCoordinates = {
      left: Math.min(boundingBoxPoints.start[0], boundingBoxPoints.end[0]),
      right: Math.max(boundingBoxPoints.start[0], boundingBoxPoints.end[0]),
      top: Math.min(boundingBoxPoints.start[1], boundingBoxPoints.end[1]),
      bottom: Math.max(boundingBoxPoints.start[1], boundingBoxPoints.end[1]),
    };
    const testCoordinates = {
      left: Math.min(testPoints.start[0], testPoints.end[0]),
      right: Math.max(testPoints.start[0], testPoints.end[0]),
      top: Math.min(testPoints.start[1], testPoints.end[1]),
      bottom: Math.max(testPoints.start[1], testPoints.end[1]),
    };

    switch (true) {
      // check horizontal axis bounds
      case testCoordinates.left < boundingBoxCoordinates.left ||
        testCoordinates.right > boundingBoxCoordinates.right:
        return false;

      // check vertical axis bounds
      case testCoordinates.top < boundingBoxCoordinates.top ||
        testCoordinates.bottom > boundingBoxCoordinates.bottom:
        return false;
      default:
        return true;
    }
  }
  static drawShapes(array: IEntity[], ctx: CanvasRenderingContext2D) {
    array.forEach((item) => {
      switch (item.type) {
        case TOOL_OPTIONS.CIRCLE:
          new Circle(item.entity).drawShape(ctx);
          break;
        case TOOL_OPTIONS.RECTANGLE:
          new Rectangle(item.entity).drawShape(ctx);
          break;
        case TOOL_OPTIONS.LINE:
          new Line(item.entity).drawShape(ctx);
          break;
      }
    });
  }
}

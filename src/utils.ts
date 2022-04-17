import {
  BOUNDS_PROPS,
  CIRCLE_BOUNDS_PROPS,
  FILLED_POINT_TYPE,
} from 'interfaces';

type BOX_POINTS = {
  start: FILLED_POINT_TYPE;
  end: FILLED_POINT_TYPE;
};

export class Utils {
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
      centerPoint[0] - cBounds.radius,
    ];
    rectBounds.finalPoint = [
      centerPoint[0] + cBounds.radius,
      centerPoint[0] + cBounds.radius,
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
}

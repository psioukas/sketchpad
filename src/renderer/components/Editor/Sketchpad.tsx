import {
  ListItem,
  ListItemProps,
  styled,
  Theme,
  useTheme,
} from '@mui/material';
import { BOUNDS_PROPS, TOOL_OPTIONS } from 'interfaces';
import { observer } from 'mobx-react-lite';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { IEntity, ToolStore } from 'store/Store';
import { Utils } from 'utils';
import {
  Circle,
  Line,
  Rectangle,
  SelectBox,
} from '../../utils/ShapeFunctions/index';

interface SketchpadButtonProps extends ListItemProps {
  rotate?: number;
  enabled: boolean;
  theme: Theme;
}
const CanvasToolButton = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'enabled' && prop !== 'rotate',
})(({ enabled, theme, ...props }: SketchpadButtonProps) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '40px',
  height: '40px',
  '& > span': {
    padding: '4px',
    pointerEvents: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    userSelect: 'none',
    boxShadow: `0 0 0 2px ${enabled ? 'black' : 'white'}`,
    borderRadius: '25%',
    '& > span': {
      ...(props.rotate && {
        transformOrigin: 'center',
        transform: `rotate(${props.rotate}deg)`,
      }),
    },
  },
  '& .below': {
    position: 'absolute',
    bottom: -15,
    left: 0,
    zIndex: 3000,
  },
}));
function handleMouseWheel(e: WheelEvent) {
  const direction = e.deltaY;
  switch (true) {
    case direction > 0:
      return ToolStore.cycleUp();
    case direction < 0:
      return ToolStore.cycleDown();
  }
}
function handleResizeWindow(canvasRefs: RefObject<HTMLCanvasElement>[]) {
  canvasRefs.forEach((canvasRef) => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  });
}
function addListeners(canvasRefs: RefObject<HTMLCanvasElement>[]) {
  window.addEventListener('wheel', handleMouseWheel);
  window.addEventListener('resize', () => handleResizeWindow(canvasRefs));
}
function removeListeners(canvasRefs: RefObject<HTMLCanvasElement>[]) {
  window.removeEventListener('wheel', handleMouseWheel);
  window.removeEventListener('resize', () => handleResizeWindow(canvasRefs));
}
interface IKeysPressed {
  [index: string]: boolean;
}

const Sketchpad = () => {
  const store = ToolStore;
  const keysPressed = useRef<IKeysPressed>({});

  function handleKeyUp(e: KeyboardEvent) {
    e.preventDefault();
    delete keysPressed.current[e.key];
  }
  function handleKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    const { key, ctrlKey } = e;
    keysPressed.current[key] = true;
    if (keysPressed.current['z'] && ctrlKey)
      console.log('Undo logic goes here!!');
  }

  const canvas = useRef<HTMLCanvasElement>(null);
  const drawCanvas = useRef<HTMLCanvasElement>(null);
  const mouseCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    addListeners([canvas, drawCanvas, mouseCanvas]);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      removeListeners([canvas, drawCanvas, mouseCanvas]);
    };
  }, []);

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const theme = useTheme();
  const toolWidthRef = useRef<number>(4);

  const context = useRef<CanvasRenderingContext2D | null>(null);

  const drawContext = useRef<CanvasRenderingContext2D | null>(null);
  const mouseContext = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvas.current && drawCanvas.current && mouseCanvas.current) {
      canvas.current.width = innerWidth;
      canvas.current.height = innerHeight - 70;
      const _context: CanvasRenderingContext2D | null =
        canvas.current.getContext('2d');
      if (_context) {
        _context.lineCap = 'round';
        _context.strokeStyle = 'black';
        _context.lineWidth = 4;
        context.current = _context;
      }

      mouseCanvas.current.width = innerWidth;
      mouseCanvas.current.height = innerHeight - 70;
      const _mouseContext: CanvasRenderingContext2D | null =
        mouseCanvas.current.getContext('2d');
      if (_mouseContext) {
        _mouseContext.lineCap = 'round';
        _mouseContext.strokeStyle = 'blue';
        _mouseContext.lineWidth = 4;
        mouseContext.current = _mouseContext;
      }

      drawCanvas.current.width = innerWidth;
      drawCanvas.current.height = innerHeight - 70;
      const _drawContext: CanvasRenderingContext2D | null =
        drawCanvas.current.getContext('2d');
      if (_drawContext) {
        _drawContext.lineCap = 'round';
        _drawContext.strokeStyle = 'rgba(0,0,0,0.4)';
        _drawContext.lineWidth = 2;
        drawContext.current = _drawContext;
      }
    }
  }, []);

  //Shape mutable ref init
  const circleRef = useRef<Circle>(new Circle());
  const lineRef = useRef<Line>(new Line());
  const selectBoxRef = useRef<SelectBox>(new SelectBox());
  const rectangleRef = useRef<Rectangle>(new Rectangle());

  const circle = circleRef.current;
  const line = lineRef.current;
  const rectangle = rectangleRef.current;
  const selectBox = selectBoxRef.current;

  const setToolWidth = (value: number) => {
    if (context.current && drawContext.current) {
      toolWidthRef.current = Number(value);

      context.current.lineWidth = Number(value);
      drawContext.current.lineWidth = Number(value);

      drawContext.current.save();
      context.current.save();
    }
  };

  function clearDrawCanvas() {
    if (canvas.current && drawContext.current) {
      const canvasWidth = canvas.current.width;
      const canvasHeight = canvas.current.height;
      drawContext.current.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }
  function clearCanvas() {
    if (canvas.current && context.current && drawContext.current) {
      const canvasWidth = canvas.current.width;
      const canvasHeight = canvas.current.height;
      context.current.clearRect(0, 0, canvasWidth, canvasHeight);
      drawContext.current.clearRect(0, 0, canvasWidth, canvasHeight);
      circleRef.current = new Circle();
      lineRef.current = new Line();
      rectangleRef.current = new Rectangle();
    }
  }

  function createCanvasScreenshot(
    _canvas: HTMLCanvasElement,
    _context: CanvasRenderingContext2D
  ): Promise<void> {
    const canvasWidth = _canvas.width;
    const canvasHeight = _canvas.height;
    const drawingsImage = new Image(canvasWidth, canvasHeight);
    const blankCanvasImage = new Image(canvasWidth, canvasHeight);

    const drawingsImageDataUrl = _canvas.toDataURL('image/png');
    _context.fillStyle = 'white';
    _context.fillRect(0, 0, canvasWidth, canvasHeight);
    const blankCanvasImageDataUrl = _canvas.toDataURL('image/png');

    clearCanvas();

    drawingsImage.src = drawingsImageDataUrl;
    blankCanvasImage.src = blankCanvasImageDataUrl;
    return new Promise((resolve, reject) => {
      try {
        drawingsImage.onload = () => {
          blankCanvasImage.onload = () => {
            _context.drawImage(blankCanvasImage, 0, 0);
            _context.drawImage(drawingsImage, 0, 0);
            resolve();
          };
        };
      } catch (error) {
        reject({ error });
      }
    });
  }
  const setSelectionStyles = () => {
    if (drawContext.current) {
      drawContext.current.save();
      drawContext.current.strokeStyle = 'rgba(0,0,0,0.45)';
      drawContext.current.lineWidth = 1;
      drawContext.current.setLineDash([2, 4, 6, 10]);
    }
  };
  const resetSelectionStyles = () => {
    if (drawContext.current) {
      drawContext.current.restore();
    }
  };
  const renderSelection = () => {
    if (
      selectBox.readyToRender &&
      context.current &&
      drawCanvas.current &&
      drawContext.current
    ) {
      setSelectionStyles();
      const entity = selectBox.renderShape(drawContext.current);
      resetSelectionStyles();
      clearDrawCanvas();
      drawContext.current.clearRect(
        0,
        0,
        drawCanvas.current.width,
        drawCanvas.current.height
      );
      let bounds: BOUNDS_PROPS = SelectBox.parseFromJSON(entity).getBounds();

      const { selected, unSelected } = store.findSelectionElements(bounds);

      selectBox.reset();
      redrawAll(selected, unSelected);
    }
  };

  function redrawAll(selected: IEntity[], unselected: IEntity[]) {
    clearCanvas();

    requestAnimationFrame(
      () => context.current && Utils.drawShapes(unselected, context.current)
    );
    requestAnimationFrame(() => {
      if (context.current) {
        context.current.save();
        context.current.strokeStyle = 'purple';
        Utils.drawShapes(selected, context.current);
        context.current.restore();
      }
    });
  }

  const renderCircle = () => {
    if (circle.readyToRender && context.current && drawContext.current) {
      const entity = circle.renderShape(context.current, drawContext.current);
      store.addElement(entity, TOOL_OPTIONS.CIRCLE);
    }
  };

  const renderRect = () => {
    if (rectangle.readyToRender && context.current && drawContext.current) {
      const entity = rectangle.renderShape(
        context.current,
        drawContext.current
      );
      store.addElement(entity, TOOL_OPTIONS.RECTANGLE);
    }
  };
  const renderLine = () => {
    if (line.readyToRender && context.current && drawContext.current) {
      const entity = line.renderShape(context.current, drawContext.current);
      store.addElement(entity, TOOL_OPTIONS.LINE);
    }
  };

  const handleCreateScreenshot = async () => {
    if (canvas.current && context.current && drawContext.current) {
      try {
        await createCanvasScreenshot(canvas.current, context.current);

        const canvasImage = canvas.current.toDataURL('image/png');

        downloadScreenshot(canvasImage, `Screenshot ${Date.now()}`);
      } catch (error) {
        console.log(error);
      }
    }
  };

  function downloadScreenshot(canvasImage: string, screenshotName: string) {
    const downloadElement = document.createElement('a');
    downloadElement.download = screenshotName + '.png';
    downloadElement.href = canvasImage;

    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);
  }

  const startDrawing = (e: React.MouseEvent) => {
    if (!isDrawing) setIsDrawing(true);
    if (e.button === 2) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    // {
    //   handleCreateScreenshot();
    //   e.stopPropagation();
    //   e.preventDefault();
    //   return;
    // }
    const { offsetX, offsetY } = e.nativeEvent;
    switch (store.current) {
      case TOOL_OPTIONS.SELECT_BOX:
        handleSelectCreation(offsetX, offsetY);
        break;
      case TOOL_OPTIONS.CIRCLE:
        handleCircleCreation(offsetX, offsetY);
        break;
      case TOOL_OPTIONS.RECTANGLE:
        handleRectangleCreation(offsetX, offsetY);
        break;
      case TOOL_OPTIONS.LINE:
        handleLineCreation(offsetX, offsetY);
        break;
      default:
        break;
    }
  };

  const stopDrawing = (e: React.MouseEvent) => {
    if (drawCanvas.current && context.current && drawContext.current) {
      if (isDrawing) return;
      if (e.button === 2) return;
      drawContext.current.clearRect(
        0,
        0,
        drawCanvas.current.width,
        drawCanvas.current.height
      );
      switch (store.current) {
        case TOOL_OPTIONS.SELECT_BOX:
          renderSelection();
          break;
        case TOOL_OPTIONS.LINE:
          renderLine();
          break;
        case TOOL_OPTIONS.RECTANGLE:
          return renderRect();
        case TOOL_OPTIONS.CIRCLE:
          return renderCircle();
      }
    }
  };
  const draw = (offsetX: number, offsetY: number) => {
    if (drawContext.current && context.current) {
      switch (store.current) {
        case TOOL_OPTIONS.SELECT_BOX:
          if (
            !selectBox.readyToRender &&
            selectBox.initialPointSet &&
            !selectBox.drawingFinalPointSet
          ) {
            setSelectionStyles();
            selectBox.setDrawingFinalPoint(offsetX, offsetY);
            selectBox.renderPreview(drawContext.current);
            resetSelectionStyles();
          }
          break;
        case TOOL_OPTIONS.CIRCLE:
          if (
            !circle.readyToRender &&
            circle.centerPointSet &&
            !circle.drawingOuterPointSet
          ) {
            circle.setDrawingOuterPoint(offsetX, offsetY);

            drawContext.current && circle.renderPreview(drawContext.current);
          }

          break;
        case TOOL_OPTIONS.RECTANGLE:
          if (
            !rectangle.readyToRender &&
            rectangle.initialPointSet &&
            !rectangle.drawingFinalPointSet
          ) {
            rectangle.setDrawingFinalPoint(offsetX, offsetY);

            drawContext.current && rectangle.renderPreview(drawContext.current);
          }
          break;
        case TOOL_OPTIONS.LINE:
          if (
            !line.readyToRender &&
            line.initialPointSet &&
            !line.drawingFinalPointSet
          ) {
            line.setDrawingFinalPoint(offsetX, offsetY);

            drawContext.current && line.renderPreview(drawContext.current);
          }
          break;
      }
    }
  };

  const mouseMove = (e: React.MouseEvent) => {
    const { offsetX, offsetY } = e.nativeEvent;
    if (
      canvas.current &&
      (offsetX < 0 ||
        offsetX > canvas.current?.width ||
        offsetY < 0 ||
        offsetY > canvas.current?.height)
    ) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (mouseContext.current && mouseCanvas.current) {
      mouseContext.current.clearRect(
        0,
        0,
        mouseCanvas.current.width,
        mouseCanvas.current.height
      );
      const bRect = mouseCanvas.current.getBoundingClientRect();
      const mX = e.clientX - bRect.left;
      const mY = e.clientY - bRect.top;
      mouseContext.current.beginPath();
      mouseContext.current.rect(
        // e.nativeEvent.offsetX,
        // e.nativeEvent.offsetY,
        mX,
        mY,
        1,
        1
      );
      mouseContext.current.stroke();
    }
    if (isDrawing) draw(offsetX, offsetY);
  };
  const handleToolSelection = (e: React.MouseEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget) return;
    const toolName = Object.values(TOOL_OPTIONS).find(
      (tool) => tool === e.currentTarget.id
    );

    if (store.current === toolName) {
      store.clearTool();
    } else {
      toolName && store.setTool(toolName);
    }
    if (toolName && TOOL_OPTIONS[toolName] === TOOL_OPTIONS.BRUSH_SIZE_PICKER)
      store.toggleDisplayBrush();
  };
  function handleImportFromStorage(e: React.MouseEvent) {
    window.electron.ipcRenderer.saveData(JSON.stringify(store.elements,null,2));
    clearCanvas();
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(false);
    setTimeout(() => {
      store.elements.forEach((item: IEntity) => {
        let entity: Circle | Rectangle | Line | null = null;
        if (context.current) {
          switch (item.type) {
            case TOOL_OPTIONS.CIRCLE:
              entity = new Circle(item.entity);
              entity.drawShape(context.current);
              break;
            case TOOL_OPTIONS.RECTANGLE:
              entity = new Rectangle(item.entity);
              entity.drawShape(context.current);
              break;
            case TOOL_OPTIONS.LINE:
              entity = new Line(item.entity);
              break;
            default:
              break;
          }
          if (entity) entity.drawShape(context.current);
        }
      }, 3000);
    });
  }

  function handleCircleCreation(offsetX: number, offsetY: number) {
    switch (true) {
      case !circle.readyToRender && !circle.centerPointSet:
        circle.setCenterPoint(offsetX, offsetY);
        break;
      case !circle.readyToRender &&
        circle.centerPointSet &&
        !circle.outerPointSet:
        circle.setOuterPoint(offsetX, offsetY);
        circle.setReadyToRender = true;
        setIsDrawing(false);
        return;
      default:
        break;
    }
  }
  function handleRectangleCreation(offsetX: number, offsetY: number) {
    switch (true) {
      case !rectangle.readyToRender && !rectangle.initialPointSet:
        rectangle.setInitialPoint(offsetX, offsetY);
        break;
      case !rectangle.readyToRender &&
        rectangle.initialPointSet &&
        !rectangle.finalPointSet:
        rectangle.setFinalPoint(offsetX, offsetY);
        rectangle.setReadyToRender = true;
        setIsDrawing(false);
        return;
      default:
        break;
    }
  }
  function handleLineCreation(offsetX: number, offsetY: number) {
    switch (true) {
      case !line.readyToRender && !line.initialPointSet:
        line.setInitialPoint(offsetX, offsetY);
        break;
      case !line.readyToRender && line.initialPointSet && !line.finalPointSet:
        line.setFinalPoint(offsetX, offsetY);
        line.setReadyToRender = true;
        setIsDrawing(false);
        return;
      default:
        break;
    }
  }
  function handleSelectCreation(offsetX: number, offsetY: number) {
    switch (true) {
      case !selectBox.readyToRender && !selectBox.initialPointSet:
        selectBox.setInitialPoint(offsetX, offsetY);
        break;
      case !selectBox.readyToRender &&
        selectBox.initialPointSet &&
        !selectBox.finalPointSet:
        selectBox.setFinalPoint(offsetX, offsetY);
        selectBox.setReadyToRender = true;
        setIsDrawing(false);
        return;
      default:
        break;
    }
  }

  const handleToolWidthChange = (
    e: React.FocusEvent<HTMLInputElement>
  ): void => {
    const { valueAsNumber } = e.target;
    e.preventDefault();
    e.stopPropagation();
    setToolWidth(valueAsNumber);
  };

  return (
    <div id="canvasContainer">
      <ul id="canvasButtons">
        <span>Current Tool:{store.current}</span>
        <span>Previous Tool:{store.previous}</span>
        <CanvasToolButton
          id={TOOL_OPTIONS.BRUSH_SIZE_PICKER}
          className="material-icons"
          theme={theme}
          enabled={store.displayBrush}
          onClick={handleToolSelection}
        >
          <span>brush</span>
          <input
            className="below"
            hidden={!store.displayBrush}
            defaultValue={4}
            onBlur={handleToolWidthChange}
            type="range"
            min={1}
            max={100}
          />
        </CanvasToolButton>

        <CanvasToolButton
          id={TOOL_OPTIONS.LINE}
          className="material-icons"
          theme={theme}
          enabled={store.current === TOOL_OPTIONS.LINE}
          onClick={handleToolSelection}
        >
          <span>
            <span>horizontal_rule</span>
          </span>
        </CanvasToolButton>
        <CanvasToolButton
          id={TOOL_OPTIONS.RECTANGLE}
          className="material-icons"
          theme={theme}
          enabled={store.current === TOOL_OPTIONS.RECTANGLE}
          onClick={handleToolSelection}
        >
          <span>
            <span>rectangle</span>
          </span>
        </CanvasToolButton>

        <CanvasToolButton
          id={TOOL_OPTIONS.CIRCLE}
          className="material-icons"
          theme={theme}
          enabled={store.current === TOOL_OPTIONS.CIRCLE}
          onClick={handleToolSelection}
        >
          <span>circle</span>
        </CanvasToolButton>
        <CanvasToolButton
          id={TOOL_OPTIONS.DIAMOND}
          className="material-icons"
          theme={theme}
          enabled={store.current === TOOL_OPTIONS.DIAMOND}
          onClick={handleToolSelection}
        >
          <span>diamond </span>
        </CanvasToolButton>
        <CanvasToolButton
          id={TOOL_OPTIONS.SELECT_BOX}
          className="material-icons"
          theme={theme}
          enabled={store.current === TOOL_OPTIONS.SELECT_BOX}
          onClick={handleToolSelection}
        >
          <span>highlight_alt</span>
        </CanvasToolButton>
      </ul>
      <canvas
        id="canvas"
        ref={canvas}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onContextMenu={handleImportFromStorage}
      />
      <canvas
        id="drawCanvas"
        ref={drawCanvas}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={mouseMove}
        onContextMenu={handleImportFromStorage}
      />
      <canvas
        id="mouseCanvas"
        ref={mouseCanvas}
        onMouseMove={mouseMove}
        onContextMenu={handleImportFromStorage}
      />
    </div>
  );
};
export default observer(Sketchpad);

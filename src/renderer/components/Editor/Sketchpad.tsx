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

  if (direction > 0) {
    return ToolStore.cycleUp();
  }

  return ToolStore.cycleDown();
}

function handleResizeWindow(canvasRefs: RefObject<HTMLCanvasElement>[]) {
  canvasRefs.forEach((canvasRef) => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight - 70;
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
    if (keysPressed.current.z && ctrlKey) {
      console.log('Undo logic goes here!!');
    }
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

  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const drawContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const mouseContextRef = useRef<CanvasRenderingContext2D | null>(null);

  function handleImportFromStorage(elements: IEntity[]) {
    elements.forEach((item: IEntity) => {
      let entity: Circle | Rectangle | Line | null = null;
      if (contextRef.current) {
        switch (item.type) {
          case TOOL_OPTIONS.CIRCLE:
            entity = new Circle(item.entity);
            entity.drawShape(contextRef.current);
            break;
          case TOOL_OPTIONS.RECTANGLE:
            entity = new Rectangle(item.entity);
            entity.drawShape(contextRef.current);
            break;
          case TOOL_OPTIONS.LINE:
            entity = new Line(item.entity);
            break;
          default:
            break;
        }
        if (entity) entity.drawShape(contextRef.current);
      }
    });
  }

  useEffect(() => {
    function handleParseImportData(data: string) {
      if (data && data.length > 0) {
        const entities = JSON.parse(data) as IEntity[];
        handleImportFromStorage(entities);
      }
    }

    if (canvas.current && drawCanvas.current && mouseCanvas.current) {
      canvas.current.width = window.innerWidth;
      canvas.current.height = window.innerHeight - 70;

      const context: CanvasRenderingContext2D | null =
        canvas.current.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 4;
        contextRef.current = context;
      }

      mouseCanvas.current.width = window.innerWidth;
      mouseCanvas.current.height = window.innerHeight - 70;
      const mouseContext: CanvasRenderingContext2D | null =
        mouseCanvas.current.getContext('2d');
      if (mouseContext) {
        mouseContext.lineCap = 'round';
        mouseContext.strokeStyle = 'blue';
        mouseContext.lineWidth = 4;
        mouseContextRef.current = mouseContext;
      }

      drawCanvas.current.width = window.innerWidth;
      drawCanvas.current.height = window.innerHeight - 70;
      const drawContext: CanvasRenderingContext2D | null =
        drawCanvas.current.getContext('2d');
      if (drawContext) {
        drawContext.lineCap = 'round';
        drawContext.strokeStyle = 'rgba(0,0,0,0.4)';
        drawContext.lineWidth = 2;
        drawContextRef.current = drawContext;
      }

      window.electron.ipcRenderer.on('import-data', handleParseImportData);
    }
    return () => {
      window.electron.ipcRenderer.removeListener(
        'import-data',
        handleParseImportData
      );
    };
  }, []);

  // Shape mutable ref init
  const circleRef = useRef<Circle>(new Circle());
  const lineRef = useRef<Line>(new Line());
  const selectBoxRef = useRef<SelectBox>(new SelectBox());
  const rectangleRef = useRef<Rectangle>(new Rectangle());

  const circle = circleRef.current;
  const line = lineRef.current;
  const rectangle = rectangleRef.current;
  const selectBox = selectBoxRef.current;

  const setToolWidth = (value: number) => {
    if (contextRef.current && drawContextRef.current) {
      toolWidthRef.current = Number(value);

      contextRef.current.lineWidth = Number(value);
      drawContextRef.current.lineWidth = Number(value);

      drawContextRef.current.save();
      contextRef.current.save();
    }
  };

  const handleToolSelection = (e: React.MouseEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget) return;
    const toolName = Object.values(TOOL_OPTIONS).find(
      (tool) => tool === e.currentTarget.id
    );

    if (store.current === toolName) {
      store.clearTool();
    } else if (toolName) {
      store.setTool(toolName);
    }
    if (toolName && TOOL_OPTIONS[toolName] === TOOL_OPTIONS.BRUSH_SIZE_PICKER)
      store.toggleDisplayBrush();
  };

  function handleCircleCreation(offsetX: number, offsetY: number) {
    if (!circle.readyToRender) {
      if (!circle.centerPointSet) {
        circle.setCenterPoint(offsetX, offsetY);
      }
      if (circle.centerPointSet && !circle.outerPointSet) {
        circle.setOuterPoint(offsetX, offsetY);
        circle.setReadyToRender = true;
        setIsDrawing(false);
      }
    }
  }

  function handleRectangleCreation(offsetX: number, offsetY: number) {
    if (!rectangle.readyToRender) {
      if (!rectangle.initialPointSet) {
        rectangle.setInitialPoint(offsetX, offsetY);
      }
      if (rectangle.initialPointSet && !rectangle.finalPointSet) {
        rectangle.setFinalPoint(offsetX, offsetY);
        rectangle.setReadyToRender = true;
        setIsDrawing(false);
      }
    }
  }

  function handleLineCreation(offsetX: number, offsetY: number) {
    if (!line.readyToRender) {
      if (!line.initialPointSet) {
        line.setInitialPoint(offsetX, offsetY);
      }
      if (line.initialPointSet && !line.finalPointSet) {
        line.setFinalPoint(offsetX, offsetY);
        line.setReadyToRender = true;
        setIsDrawing(false);
      }
    }
  }

  function handleSelectCreation(offsetX: number, offsetY: number) {
    if (!selectBox.readyToRender) {
      if (!selectBox.initialPointSet) {
        selectBox.setInitialPoint(offsetX, offsetY);
      } else if (selectBox.initialPointSet && !selectBox.finalPointSet) {
        selectBox.setFinalPoint(offsetX, offsetY);
        selectBox.setReadyToRender = true;
        setIsDrawing(false);
      }
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

  function clearDrawCanvas() {
    if (canvas.current && drawContextRef.current) {
      const canvasWidth = canvas.current.width;
      const canvasHeight = canvas.current.height;
      drawContextRef.current.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  function clearCanvas() {
    if (canvas.current && contextRef.current && drawContextRef.current) {
      const canvasWidth = canvas.current.width;
      const canvasHeight = canvas.current.height;
      contextRef.current.clearRect(0, 0, canvasWidth, canvasHeight);
      drawContextRef.current.clearRect(0, 0, canvasWidth, canvasHeight);
      circleRef.current = new Circle();
      lineRef.current = new Line();
      rectangleRef.current = new Rectangle();
    }
  }

  // function createCanvasScreenshot(
  //   _canvas: HTMLCanvasElement,
  //   _context: CanvasRenderingContext2D
  // ): Promise<void> {
  //   const canvasWidth = _canvas.width;
  //   const canvasHeight = _canvas.height;
  //   const drawingsImage = new Image(canvasWidth, canvasHeight);
  //   const blankCanvasImage = new Image(canvasWidth, canvasHeight);
  //
  //   const drawingsImageDataUrl = _canvas.toDataURL('image/png');
  //   _context.fillStyle = 'white';
  //   _context.fillRect(0, 0, canvasWidth, canvasHeight);
  //   const blankCanvasImageDataUrl = _canvas.toDataURL('image/png');
  //
  //   clearCanvas();
  //
  //   drawingsImage.src = drawingsImageDataUrl;
  //   blankCanvasImage.src = blankCanvasImageDataUrl;
  //   return new Promise((resolve, reject) => {
  //     try {
  //       drawingsImage.onload = () => {
  //         blankCanvasImage.onload = () => {
  //           _context.drawImage(blankCanvasImage, 0, 0);
  //           _context.drawImage(drawingsImage, 0, 0);
  //           resolve();
  //         };
  //       };
  //     } catch (error) {
  //       reject(error);
  //     }
  //   });
  // }

  const setSelectionStyles = () => {
    if (drawContextRef.current) {
      drawContextRef.current.save();
      drawContextRef.current.strokeStyle = 'rgba(0,0,0,0.45)';
      drawContextRef.current.lineWidth = 1;
      drawContextRef.current.setLineDash([2, 4, 6, 10]);
    }
  };
  const resetSelectionStyles = () => {
    if (drawContextRef.current) {
      drawContextRef.current.restore();
    }
  };

  function redrawAll(selected: IEntity[], unselected: IEntity[]) {
    clearCanvas();

    requestAnimationFrame(
      () =>
        contextRef.current && Utils.drawShapes(unselected, contextRef.current)
    );
    requestAnimationFrame(() => {
      if (contextRef.current) {
        contextRef.current.save();
        contextRef.current.strokeStyle = 'purple';
        Utils.drawShapes(selected, contextRef.current);
        contextRef.current.restore();
      }
    });
  }

  const renderSelection = () => {
    if (
      selectBox.readyToRender &&
      contextRef.current &&
      drawCanvas.current &&
      drawContextRef.current
    ) {
      setSelectionStyles();
      const entity = selectBox.renderShape(drawContextRef.current);
      resetSelectionStyles();
      clearDrawCanvas();
      drawContextRef.current.clearRect(
        0,
        0,
        drawCanvas.current.width,
        drawCanvas.current.height
      );
      const bounds: BOUNDS_PROPS = SelectBox.parseFromJSON(entity).getBounds();

      const { selected, unSelected } = store.findSelectionElements(bounds);

      selectBox.reset();
      redrawAll(selected, unSelected);
    }
  };

  const renderCircle = () => {
    if (circle.readyToRender && contextRef.current && drawContextRef.current) {
      const entity = circle.renderShape(
        contextRef.current,
        drawContextRef.current
      );
      store.addElement(entity, TOOL_OPTIONS.CIRCLE);
    }
  };

  const renderRect = () => {
    if (
      rectangle.readyToRender &&
      contextRef.current &&
      drawContextRef.current
    ) {
      const entity = rectangle.renderShape(
        contextRef.current,
        drawContextRef.current
      );
      store.addElement(entity, TOOL_OPTIONS.RECTANGLE);
    }
  };
  const renderLine = () => {
    if (line.readyToRender && contextRef.current && drawContextRef.current) {
      const entity = line.renderShape(
        contextRef.current,
        drawContextRef.current
      );
      store.addElement(entity, TOOL_OPTIONS.LINE);
    }
  };

  // const handleCreateScreenshot = async () => {
  //   if (canvas.current && contextRef.current && drawContextRef.current) {
  //     try {
  //       await createCanvasScreenshot(canvas.current, contextRef.current);
  //
  //       const canvasImage = canvas.current.toDataURL('image/png');
  //
  //       downloadScreenshot(canvasImage, `Screenshot ${Date.now()}`);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  // };

  // function downloadScreenshot(canvasImage: string, screenshotName: string) {
  //   const downloadElement = document.createElement('a');
  //   downloadElement.download = screenshotName + '.png';
  //   downloadElement.href = canvasImage;
  //
  //   document.body.appendChild(downloadElement);
  //   downloadElement.click();
  //   document.body.removeChild(downloadElement);
  // }

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
    if (drawCanvas.current && contextRef.current && drawContextRef.current) {
      if (isDrawing) return;
      if (e.button === 2) return;
      drawContextRef.current.clearRect(
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
          renderRect();
          break;
        case TOOL_OPTIONS.CIRCLE:
          renderCircle();
          break;
        default:
          break;
      }
    }
  };
  const draw = (offsetX: number, offsetY: number) => {
    if (drawContextRef.current && contextRef.current) {
      switch (store.current) {
        case TOOL_OPTIONS.SELECT_BOX:
          if (
            !selectBox.readyToRender &&
            selectBox.initialPointSet &&
            !selectBox.drawingFinalPointSet
          ) {
            setSelectionStyles();
            selectBox.setDrawingFinalPoint(offsetX, offsetY);
            selectBox.renderPreview(drawContextRef.current);
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

            if (drawContextRef.current) {
              circle.renderPreview(drawContextRef.current);
            }
          }

          break;
        case TOOL_OPTIONS.RECTANGLE:
          if (
            !rectangle.readyToRender &&
            rectangle.initialPointSet &&
            !rectangle.drawingFinalPointSet
          ) {
            rectangle.setDrawingFinalPoint(offsetX, offsetY);

            if (drawContextRef.current) {
              rectangle.renderPreview(drawContextRef.current);
            }
          }
          break;
        case TOOL_OPTIONS.LINE:
          if (
            !line.readyToRender &&
            line.initialPointSet &&
            !line.drawingFinalPointSet
          ) {
            line.setDrawingFinalPoint(offsetX, offsetY);

            if (drawContextRef.current) {
              line.renderPreview(drawContextRef.current);
            }
          }
          break;
        default:
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

    if (mouseContextRef.current && mouseCanvas.current) {
      mouseContextRef.current.clearRect(
        0,
        0,
        mouseCanvas.current.width,
        mouseCanvas.current.height
      );
      const bRect = mouseCanvas.current.getBoundingClientRect();
      const mX = e.clientX - bRect.left;
      const mY = e.clientY - bRect.top;
      mouseContextRef.current.beginPath();
      mouseContextRef.current.rect(
        // e.nativeEvent.offsetX,
        // e.nativeEvent.offsetY,
        mX,
        mY,
        1,
        1
      );
      mouseContextRef.current.stroke();
    }
    if (isDrawing) draw(offsetX, offsetY);
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
      />
      <canvas
        id="drawCanvas"
        ref={drawCanvas}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={mouseMove}
      />
      <canvas id="mouseCanvas" ref={mouseCanvas} onMouseMove={mouseMove} />
    </div>
  );
};
export default observer(Sketchpad);

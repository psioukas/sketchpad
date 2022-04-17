import { styled, Theme, useTheme } from '@mui/material';
import { useEffect, useRef } from 'react';
enum iconStates {
  initial = 'hourglass_empty',
  top = 'hourglass_top',
  bottom = 'hourglass_bottom',
  full = 'hourglass_full',
}
export type LoadingProps = {
  loading: boolean;
  size?: 's' | 'm' | 'l';
  color?: string;
  setAnimationFinished?: (isFinished: boolean) => void;
};
const StyledLoading = styled('span', {
  shouldForwardProp: (prop) =>
    !['loading', 'size', 'color'].includes(String(prop)),
})(({ theme, ...props }: { theme: Theme } & LoadingProps) => {
  let fontSize = 6;
  if (props?.size)
    switch (props.size) {
      case 's':
        fontSize = 4;
        break;
      case 'm':
        fontSize = 12;
        break;
      case 'l':
        fontSize = 24;
        break;
    }
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    height: theme.spacing(fontSize),
    width: theme.spacing(fontSize),
    fontSize: theme.spacing(fontSize),
    transformOrigin: 'center',

    filter:
      'invert(0.45) brightness(0.88) sepia(1) contrast(125%) saturate(4119%) hue-rotate(200deg)',
    ...(props?.color && { color: props.color }),
  };
});

const Loading = (props: LoadingProps) => {
  const theme = useTheme();
  let fpsInterval: number = 80,
    then: number = 0,
    now: number = 0,
    elapsed: number = 0,
    loops: number = 0,
    angle: number = 0;
  const interval = useRef<number>();
  const loadingRef = useRef<HTMLImageElement>(null);

  const handleFinishLoading = () => {
    props.setAnimationFinished && props.setAnimationFinished(true);
  };
  const stopLoading = () => {
    if (loadingRef.current) {
      loadingRef.current.innerHTML = iconStates.full;
      loadingRef.current.animate(
        [
          // keyframes
          {
            transform: ` translate(-50%,-50%)  rotateZ(180deg) rotateX(0deg)`,
          },
          {
            transform: ` translate(-50%,-50%)  scale(1.5) rotateZ(180deg) rotateX(0deg)`,
          },
          {
            transform: ` translate(-50%,-50%)  scale(0.6) rotateZ(180deg) rotateX(0deg)`,
            opacity: 0.25,
          },
          {
            transform: ` translate(-50%,-50%)  scale(0) rotateZ(180deg) rotateX(0deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 350,
          iterations: 1,
          fill: 'forwards',
        }
      ).onfinish = handleFinishLoading;
      interval.current && cancelAnimationFrame(interval.current);
    }
  };

  const updateLoading = () => {
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval);

      if (loadingRef.current) {
        let icon: string = iconStates.initial;
        if (!loadingRef.current) return;
        if (loops === 0) {
          loops++;
          loadingRef.current.innerHTML = iconStates.initial;
        } else if (loops % 2 === 0) {
          angle += 45;
          loadingRef.current.style.transform = `translate(-50%,-50%) rotateZ(${angle}deg)`;
          icon = angle % 2 === 0 ? iconStates.top : iconStates.bottom;
        }
        loadingRef.current.innerHTML = icon;
        loops++;
      }

    }
    if (props.loading) {
      interval.current = requestAnimationFrame(updateLoading);
    } else if (angle !== 360) {
      interval.current = requestAnimationFrame(updateLoading);
    } else {
      interval.current && cancelAnimationFrame(interval.current);
      stopLoading();
    }
  };
  useEffect(() => {
    updateLoading();
  }, [props.loading]);

  return (
    <StyledLoading
      ref={loadingRef}
      className="material-icons-two-tone"
      {...props}
      theme={theme}
    />
  );
};

export default Loading;

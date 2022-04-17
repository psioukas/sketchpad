import { ClickAwayListener, MenuItemProps, styled } from '@mui/material';
import {
  APP_BAR_BUTTONS,
  APP_BAR_BUTTONS_TYPE,
  MENU_OPTIONS,
  MENU_OPTION_TYPE,
} from 'interfaces';
import React, { useEffect, useState } from 'react';
const AppMenuNavigationBar = styled('nav')(() => ({
  position: 'absolute',
  inset: 0,
  height: '35px',
  width: '100%',
  display: 'inline-flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  background: 'white',
  WebkitAppRegion: 'drag',
  '&>*': {
    userSelect: 'none',
  },
}));

const MenuItemsRight = styled('div')(() => ({
  marginLeft: 'auto',
  display: 'flex',
  height: '100%',
}));
type IMenuItemProps = MenuItemProps & {
  isSelected: boolean;
  isHovered: boolean;
  template?: TemplateStringsArray;
};
const MenuItem = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'isHovered',
})(({ isSelected, isHovered, ...props }: IMenuItemProps) => {
  const color: string = !isSelected || !isHovered ? 'black' : '#afafaa';
  const bgColor: string = isSelected ? '#ededed' : 'white';
  return {
    '&>*': {
      userSelect: 'none',
    },
    position: 'relative',
    color: color,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: '0 8px',
    background: bgColor,
    WebkitAppRegion: 'no-drag',

    '&': {
      ...(isHovered &&
        !isSelected && {
          ':active::before': {
            transform: 'translateY(2px)',
            filter: 'blur(0.5px)',
          },
          '::before': {
            filter: 'blur(1px)',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            zIndex: '-1',
            content: '""',
            position: 'absolute',
            bottom: '0',
            height: '2px',
            transformOrigin: 'bottom',
            animation:
              'enter 300ms ease-in-out forwards,zoom 200ms 150ms ease-in-out forwards',
          },
          zIndex: isHovered && '2000',
        }),
    },
    '@keyframes enter': {
      '0%': {
        bottom: '0',
        opacity: '0',
      },

      '100%': {
        bottom: '3px',
        opacity: '100%',
      },
    },
    '@keyframes zoom': {
      '0%': {
        width: 0,
      },

      '100%': {
        width: '70%',
      },
    },
  };
});

const Appbar = () => {
  const [selectedTab, setSelectedTab] = useState<string>(MENU_OPTIONS.UNSET);
  const [hoveredEL, setHoveredEL] = useState<
    MENU_OPTION_TYPE | APP_BAR_BUTTONS_TYPE
  >(MENU_OPTIONS.UNSET);

  const handleAppMenuClosed = () => {
    setSelectedTab(MENU_OPTIONS.UNSET);
    setHoveredEL('');
  };

  useEffect(() => {
    window.electron.ipcRenderer.on('close-app-menu', handleAppMenuClosed);

    return () => {
      window.electron.ipcRenderer.removeListener(
        'close-app-menu',
        handleAppMenuClosed
      );
    };
  }, []);

  const handleHoverSelection = (
    value: MENU_OPTION_TYPE | APP_BAR_BUTTONS_TYPE
  ) => {
    setHoveredEL(value);
  };
  const handleOpenMenu = (e: React.MouseEvent, value: MENU_OPTION_TYPE) => {
    setSelectedTab(value);
    window.electron.ipcRenderer.openMenu({
      x: e.currentTarget.getBoundingClientRect().left,
      y: e.currentTarget.getBoundingClientRect().bottom,
      type: value,
    });
  };
  const handleClick = () => {
    let fn: (() => void) | undefined = undefined;
    switch (hoveredEL as APP_BAR_BUTTONS_TYPE) {
      case APP_BAR_BUTTONS.MAXIMIZE:
        fn = window.electron.ipcRenderer.maximizeWindow;
        break;
      case APP_BAR_BUTTONS.MINIMIZE:
        fn = window.electron.ipcRenderer.minimizeWindow;
        break;
      case APP_BAR_BUTTONS.CLOSE:
        fn = window.electron.ipcRenderer.closeWindow;
        break;
      default:
        break;
    }
    if (fn && fn instanceof Function) fn();
  };

  return (
    <ClickAwayListener onClickAway={() => setSelectedTab(MENU_OPTIONS.UNSET)}>
      <AppMenuNavigationBar draggable>
        {Object.entries(MENU_OPTIONS)
          .filter(([key]: [key: string, value: string]) => key !== 'UNSET')
          .map(([key, value]: [key: string, value: MENU_OPTION_TYPE]) => (
            <MenuItem
              key={key}
              isSelected={selectedTab === value}
              isHovered={hoveredEL === value}
              onClick={(e) => handleOpenMenu(e, value)}
              onMouseOver={() => handleHoverSelection(value)}
              onMouseLeave={() => setHoveredEL('')}
              onMouseDown={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
            >
              {value}
            </MenuItem>
          ))}
        <MenuItemsRight>
          <MenuItem
            isSelected={false}
            isHovered={hoveredEL === APP_BAR_BUTTONS.MINIMIZE}
            onClick={handleClick}
            onMouseOver={() => handleHoverSelection(APP_BAR_BUTTONS.MINIMIZE)}
            onMouseLeave={() => setHoveredEL('')}
            onMouseDown={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            className="material-icons"
          >
            remove
          </MenuItem>
          <MenuItem
            isSelected={false}
            isHovered={hoveredEL === APP_BAR_BUTTONS.MAXIMIZE}
            onClick={handleClick}
            onMouseOver={() => handleHoverSelection(APP_BAR_BUTTONS.MAXIMIZE)}
            onMouseLeave={() => setHoveredEL('')}
            onMouseDown={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            className="material-icons"
          >
            crop_square
          </MenuItem>
          <MenuItem
            isSelected={false}
            isHovered={hoveredEL === APP_BAR_BUTTONS.CLOSE}
            onClick={handleClick}
            onMouseOver={() => handleHoverSelection(APP_BAR_BUTTONS.CLOSE)}
            onMouseLeave={() => setHoveredEL('')}
            onMouseDown={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            className="material-icons"
          >
            close
          </MenuItem>
        </MenuItemsRight>
      </AppMenuNavigationBar>
    </ClickAwayListener>
  );
};
export default Appbar;

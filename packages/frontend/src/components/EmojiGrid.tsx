import React, { memo, useEffect, useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid, type GridChildComponentProps, type GridItemKeySelector } from 'react-window';
import type { Socket } from 'socket.io-client';

interface Emoji {
  emoji: string;
  count: number;
}

interface EmojiGridProps {
  topEmojis: Emoji[];
  socket: Socket;
  lang: string;
}

type EmojiGridItemData = { items: Emoji[]; columnCount: number; socket: Socket; lang: string };

const MIN_COLUMN_WIDTH = 90;
const ROW_HEIGHT = 40;
const CELL_PADDING = 4;

const EmojiGrid: React.FC<EmojiGridProps> = ({ topEmojis, socket, lang }) => {
  return (
    <main id="emoji-grid" className="flex-grow w-full bg-white dark:bg-gray-900 overflow-hidden">
      <AutoSizer>
        {({ height, width }) => {
          const columnCount = Math.floor(width / MIN_COLUMN_WIDTH) || 1;
          const columnWidth = Math.floor(width / columnCount);
          const rowCount = Math.ceil(topEmojis.length / columnCount);

          return (
            <Grid<EmojiGridItemData>
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={ROW_HEIGHT}
              width={width}
              overscanRowCount={10}
              itemKey={getItemKey}
              itemData={{ items: topEmojis, columnCount, socket, lang }}
            >
              {MaybeCell}
            </Grid>
          );
        }}
      </AutoSizer>
    </main>
  );
};

function getItemIndex({
  columnIndex,
  rowIndex,
  data,
}: {
  columnIndex: number;
  rowIndex: number;
  data: { columnCount: number };
}) {
  const { columnCount } = data;
  return rowIndex * columnCount + columnIndex;
}

const getItemKey: GridItemKeySelector<EmojiGridItemData> = (props) => {
  const { items, lang } = props.data;
  const index = getItemIndex(props);
  if (index >= items.length) {
    // FixedSizedGrid wants to render an element we don't have data for.
    // we don't really care what this is as long as it's unique.
    return index;
  }
  const { emoji } = items[index];

  return `${lang}-${emoji}`;
};

const MaybeCell = memo((props: GridChildComponentProps<EmojiGridItemData>) => {
  const index = getItemIndex(props);
  const items = props.data.items;
  if (index >= items.length) {
    // FixedSizedGrid wants to render an element we don't have data for.
    // this happens because it doesn't actually know how many items we have,
    // just rowCount x columnCount.
    return null;
  }
  return <Cell {...props} />;
});

const Cell = memo((props: GridChildComponentProps<EmojiGridItemData>) => {
  const {
    data: { items, socket, lang },
    style,
  } = props;
  const index = getItemIndex(props);
  const { emoji, count } = items[index];

  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // don't flash if this is the first render
    if (isFirstRun.current) {
      return;
    }

    const el = elRef.current;
    if (!el) {
      return;
    }

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const colors = cellColors[isDarkMode ? 'dark' : 'light'];
    // const animation = el.animate([{ backgroundColor: colors.highlight }, { backgroundColor: colors.default }], {
    //   duration: 900,
    //   iterations: 1,
    //   easing: 'ease-in-out',
    // });
    const animation = el.animate(
      [
        { offset: 0.0, backgroundColor: colors.default },
        { offset: 0.1, backgroundColor: colors.highlight },
        { offset: 0.9, backgroundColor: colors.default },
      ],
      {
        duration: 900,
        iterations: 1,
        easing: 'ease-in-out',
      },
    );

    return () => {
      animation.cancel();
    };
  }, [count]);

  // NOTE: order matters here, this needs to be set *after* the above reads it
  const isFirstRun = useRef<boolean>(true);
  useEffect(() => {
    isFirstRun.current = false;
    return () => {
      isFirstRun.current = true;
    };
  }, []);

  const cellStyle = {
    ...style,
    left: (style.left as number) + CELL_PADDING,
    top: (style.top as number) + CELL_PADDING,
    width: (style.width as number) - CELL_PADDING * 2,
    height: (style.height as number) - CELL_PADDING * 2,
  };

  const handleClick = () => {
    console.log(`Getting emoji info for ${emoji}`);
    socket.emit('getEmojiInfo', emoji);
    const url =
      lang === 'all' || lang === 'unknown' ?
        `https://bsky.app/search?q=${encodeURIComponent(emoji)}`
      : `https://bsky.app/search?q=${encodeURIComponent('lang:' + lang + ' ' + emoji)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      ref={elRef}
      style={cellStyle}
      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={handleClick}
    >
      <span className="text text-black dark:text-gray-100">{emoji}</span>
      <span className="text-xs text-gray-600 dark:text-gray-100">{count}</span>
    </div>
  );
});

const cellColors = {
  light: {
    highlight: '#fbe8ae',
    default: 'rgb(249 250 251)', // gray-50
  },
  dark: {
    highlight: '#666',
    default: 'rgb(45 55 72)', // gray-800
  },
};

export default memo(EmojiGrid);

window.NP = window.NP || {};

(function () {
  const neoPrintThemeStyles = {
    storageKey: 'np-theme',
    lightPalette: {
      bg: '#f5f1ea',
      panel: '#fffdf9',
      ink: '#1f1a16',
      muted: '#6b5d4d',
      accent: '#ad3f14',
      line: '#d9cec0'
    },
    darkPalette: {
      bg: '#141311',
      panel: '#1d1a17',
      ink: '#f0e7d8',
      muted: '#baa98d',
      accent: '#c46a2d',
      line: '#473d32'
    }
  };

  function useTheme() {
    const initialMode = React.useMemo(function () {
      try {
        return window.localStorage.getItem(neoPrintThemeStyles.storageKey) === 'dark';
      } catch (themeReadError) {
        return false;
      }
    }, []);

    const _useState = React.useState(initialMode);
    const dark = _useState[0];
    const setDark = _useState[1];

    React.useEffect(function () {
      try {
        window.localStorage.setItem(neoPrintThemeStyles.storageKey, dark ? 'dark' : 'light');
      } catch (themeWriteError) {
        /* no-op for restricted localStorage environments */
      }
      if (document && document.documentElement) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      }
    }, [dark]);

    const palette = dark
      ? neoPrintThemeStyles.darkPalette
      : neoPrintThemeStyles.lightPalette;

    const toggle = React.useCallback(function () {
      setDark(function (prevDark) {
        return !prevDark;
      });
    }, []);

    return {
      dark: dark,
      palette: palette,
      toggle: toggle
    };
  }

  Object.assign(window.NP, { useTheme: useTheme });
})();

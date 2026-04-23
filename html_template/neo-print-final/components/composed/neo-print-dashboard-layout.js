window.NP = window.NP || {};

(function () {
  function DashboardLayout(props) {
    const routes = props.routes || [];
    const current = props.current;
    const onRouteChange = props.onRouteChange;
    const palette = props.palette;
    const onThemeToggle = props.onThemeToggle;
    const dark = props.dark;
    const children = props.children;

    const dashboardLayoutStyles = {
      shell: {
        minHeight: '100vh',
        background: palette.bg,
        color: palette.ink,
        fontFamily: 'IBM Plex Sans, sans-serif'
      },
      grid: {
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '280px 1fr'
      },
      main: {
        padding: '22px 24px 28px',
        display: 'grid',
        alignContent: 'start',
        gap: '14px'
      }
    };

    const sidebarElement = React.createElement(window.NP.Sidebar, {
      routes: routes,
      current: current,
      onChange: onRouteChange,
      palette: palette,
      onThemeToggle: onThemeToggle,
      dark: dark
    });

    return React.createElement(
      'div',
      { style: dashboardLayoutStyles.shell },
      React.createElement(
        'div',
        { style: dashboardLayoutStyles.grid },
        sidebarElement,
        React.createElement('main', { style: dashboardLayoutStyles.main }, children)
      )
    );
  }

  Object.assign(window.NP, { DashboardLayout: DashboardLayout });
})();

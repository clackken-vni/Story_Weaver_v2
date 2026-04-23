window.NP = window.NP || {};

(function () {
  const sidebarLabelMap = {
    index: 'Command Desk',
    users: 'Users',
    projects: 'Projects',
    monitoring: 'Monitoring',
    audit: 'Audit',
    settings: 'Settings',
    ai: 'AI Bureau',
    kb: 'Knowledge Base',
    tts: 'Voice Desk',
    login: 'Access'
  };

  function Sidebar(props) {
    const routes = props.routes || [];
    const current = props.current;
    const onChange = props.onChange;
    const palette = props.palette;
    const onThemeToggle = props.onThemeToggle;
    const dark = props.dark;

    const sidebarStyles = {
      shell: {
        background: palette.panel,
        borderRight: '1px solid ' + palette.line,
        padding: '26px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      },
      brand: {
        borderBottom: '1px solid ' + palette.line,
        paddingBottom: '14px'
      },
      brandTitle: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '30px',
        lineHeight: 0.9,
        letterSpacing: '-0.01em'
      },
      brandSub: {
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: palette.muted,
        marginTop: '6px'
      },
      themeButton: {
        border: '1px solid ' + palette.line,
        padding: '10px 11px',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        textAlign: 'left',
        background: dark ? 'rgba(196,106,45,0.08)' : 'rgba(173,63,20,0.06)',
        color: palette.ink
      },
      routeStack: {
        display: 'grid',
        gap: '8px'
      },
      routeButton: function (isActive) {
        return {
          border: '1px solid ' + (isActive ? palette.accent : palette.line),
          background: isActive
            ? (dark ? 'rgba(196,106,45,0.12)' : 'rgba(173,63,20,0.08)')
            : 'transparent',
          color: palette.ink,
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left'
        };
      },
      routeLabel: {
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em'
      },
      routeIndex: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '18px',
        color: palette.muted,
        lineHeight: 1
      }
    };

    return React.createElement(
      'aside',
      { style: sidebarStyles.shell },
      React.createElement(
        'div',
        { style: sidebarStyles.brand },
        React.createElement('div', { style: sidebarStyles.brandTitle }, 'STORYWEAVER'),
        React.createElement('div', { style: sidebarStyles.brandSub }, 'Neo-Print Admin')
      ),
      React.createElement(
        'button',
        { type: 'button', style: sidebarStyles.themeButton, onClick: onThemeToggle },
        dark ? 'Mode: Nocturne' : 'Mode: Paper'
      ),
      React.createElement(
        'div',
        { style: sidebarStyles.routeStack },
        routes.map(function (routeKey, routeIndex) {
          const isActive = routeKey === current;
          return React.createElement(
            'button',
            {
              key: routeKey,
              type: 'button',
              style: sidebarStyles.routeButton(isActive),
              onClick: function () {
                if (typeof onChange === 'function') {
                  onChange(routeKey);
                }
              }
            },
            React.createElement(
              'span',
              { style: sidebarStyles.routeLabel },
              sidebarLabelMap[routeKey] || routeKey
            ),
            React.createElement(
              'span',
              { style: sidebarStyles.routeIndex },
              String(routeIndex + 1).padStart(2, '0')
            )
          );
        })
      )
    );
  }

  Object.assign(window.NP, { Sidebar: Sidebar });
})();

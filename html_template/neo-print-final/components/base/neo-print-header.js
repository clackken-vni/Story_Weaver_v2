window.NP = window.NP || {};

(function () {
  function Header(props) {
    const headline = props.headline || '';
    const sub = props.sub || '';
    const route = props.route || '';
    const palette = props.palette;
    const leadValue = props.leadValue || '--';
    const leadLabel = props.leadLabel || 'Lead signal unavailable';

    const headerStyles = {
      shell: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '14px'
      },
      editorialPanel: {
        background: palette.panel,
        border: '1px solid ' + palette.line,
        padding: '18px 18px 16px'
      },
      routeTag: {
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: palette.muted,
        marginBottom: '10px'
      },
      headline: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '56px',
        lineHeight: 0.92,
        letterSpacing: '-0.014em',
        margin: 0
      },
      sub: {
        marginTop: '12px',
        color: palette.muted,
        maxWidth: '56ch',
        fontSize: '14px',
        lineHeight: 1.5
      },
      leadPanel: {
        background: palette.panel,
        border: '1px solid ' + palette.line,
        padding: '16px 16px 14px',
        display: 'grid',
        alignContent: 'space-between',
        minHeight: '180px'
      },
      leadTitle: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '26px',
        lineHeight: 1,
        marginBottom: '8px'
      },
      leadValue: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '64px',
        lineHeight: 0.9,
        color: palette.accent
      },
      leadLabel: {
        marginTop: '8px',
        fontSize: '12px',
        letterSpacing: '0.02em',
        color: palette.muted
      }
    };

    return React.createElement(
      'section',
      { style: headerStyles.shell },
      React.createElement(
        'div',
        { style: headerStyles.editorialPanel },
        React.createElement(
          'div',
          { style: headerStyles.routeTag },
          'Edition · ' + String(route).toUpperCase()
        ),
        React.createElement('h1', { style: headerStyles.headline }, headline),
        React.createElement('p', { style: headerStyles.sub }, sub)
      ),
      React.createElement(
        'div',
        { style: headerStyles.leadPanel },
        React.createElement('div', { style: headerStyles.leadTitle }, 'Lead Signal'),
        React.createElement('div', { style: headerStyles.leadValue }, leadValue),
        React.createElement('div', { style: headerStyles.leadLabel }, leadLabel)
      )
    );
  }

  Object.assign(window.NP, { Header: Header });
})();

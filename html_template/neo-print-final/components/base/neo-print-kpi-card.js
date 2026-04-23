window.NP = window.NP || {};

(function () {
  function KpiCard(props) {
    const label = props.label || '';
    const value = props.value || '--';
    const palette = props.palette;

    const kpiCardStyles = {
      shell: {
        border: '1px solid ' + palette.line,
        background: palette.panel,
        padding: '12px 12px 10px',
        minHeight: '92px',
        display: 'grid',
        alignContent: 'space-between'
      },
      label: {
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: palette.muted
      },
      value: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '35px',
        lineHeight: 1,
        marginTop: '6px'
      }
    };

    return React.createElement(
      'article',
      { style: kpiCardStyles.shell },
      React.createElement('div', { style: kpiCardStyles.label }, label),
      React.createElement('div', { style: kpiCardStyles.value }, value)
    );
  }

  Object.assign(window.NP, { KpiCard: KpiCard });
})();

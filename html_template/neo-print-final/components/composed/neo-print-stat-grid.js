window.NP = window.NP || {};

(function () {
  function StatGrid(props) {
    const stats = props.stats || [];
    const palette = props.palette;

    const statGridStyles = {
      shell: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '12px'
      }
    };

    return React.createElement(
      'section',
      { style: statGridStyles.shell },
      stats.slice(0, 4).map(function (entry, entryIndex) {
        const label = entry[0];
        const value = entry[1];
        return React.createElement(window.NP.KpiCard, {
          key: 'stat-' + entryIndex,
          label: label,
          value: value,
          palette: palette
        });
      })
    );
  }

  Object.assign(window.NP, { StatGrid: StatGrid });
})();

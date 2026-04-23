window.NP = window.NP || {};

(function () {
  function DataTable(props) {
    const title = props.title || 'Data Table';
    const headers = props.headers || [];
    const rows = props.rows || [];
    const palette = props.palette;
    const accentColumn = typeof props.accentColumn === 'number' ? props.accentColumn : -1;

    const dataTableStyles = {
      shell: {
        border: '1px solid ' + palette.line,
        background: palette.panel,
        padding: '14px 14px 8px'
      },
      title: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '30px',
        lineHeight: 1,
        marginBottom: '10px'
      },
      table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px'
      },
      headerCell: {
        textAlign: 'left',
        padding: '8px 6px',
        borderBottom: '1px solid ' + palette.line,
        color: palette.muted,
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 500
      },
      rowCell: function (columnIndex) {
        return {
          padding: '9px 6px',
          borderBottom: '1px dashed ' + palette.line,
          color: columnIndex === accentColumn ? palette.accent : palette.ink
        };
      }
    };

    return React.createElement(
      'section',
      { style: dataTableStyles.shell },
      React.createElement('h3', { style: dataTableStyles.title }, title),
      React.createElement(
        'table',
        { style: dataTableStyles.table },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            headers.map(function (headerText, headerIndex) {
              return React.createElement(
                'th',
                { key: 'h-' + headerIndex, style: dataTableStyles.headerCell },
                headerText
              );
            })
          )
        ),
        React.createElement(
          'tbody',
          null,
          rows.map(function (row, rowIndex) {
            return React.createElement(
              'tr',
              { key: 'r-' + rowIndex },
              row.map(function (cell, columnIndex) {
                return React.createElement(
                  'td',
                  { key: 'c-' + rowIndex + '-' + columnIndex, style: dataTableStyles.rowCell(columnIndex) },
                  cell
                );
              })
            );
          })
        )
      )
    );
  }

  Object.assign(window.NP, { DataTable: DataTable });
})();

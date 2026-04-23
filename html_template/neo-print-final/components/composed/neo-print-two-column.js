window.NP = window.NP || {};

(function () {
  function TwoColumn(props) {
    const left = props.left;
    const right = props.right;
    const palette = props.palette;

    const twoColumnStyles = {
      shell: {
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '14px'
      },
      left: {
        minWidth: 0
      },
      right: {
        minWidth: 0
      },
      divider: {
        borderTop: '1px solid ' + palette.line
      }
    };

    return React.createElement(
      'section',
      { style: twoColumnStyles.shell },
      React.createElement('div', { style: twoColumnStyles.left }, left),
      React.createElement('div', { style: twoColumnStyles.right }, right)
    );
  }

  Object.assign(window.NP, { TwoColumn: TwoColumn });
})();

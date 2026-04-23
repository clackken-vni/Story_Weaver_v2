window.NP = window.NP || {};

(function () {
  function Button(props) {
    const label = props.label || 'Action';
    const onClick = props.onClick;
    const variant = props.variant || 'primary';
    const palette = props.palette;

    const buttonStyles = {
      shell: {
        border: '1px solid ' + (variant === 'primary' ? palette.accent : palette.line),
        background: variant === 'primary' ? palette.accent : 'transparent',
        color: variant === 'primary' ? palette.panel : palette.ink,
        padding: '9px 12px',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        lineHeight: 1,
        transition: 'opacity 180ms ease'
      }
    };

    return React.createElement(
      'button',
      {
        type: 'button',
        style: buttonStyles.shell,
        onClick: onClick
      },
      label
    );
  }

  Object.assign(window.NP, { Button: Button });
})();

window.NP = window.NP || {};

(function () {
  function ActivityFeed(props) {
    const title = props.title || 'Activity Feed';
    const events = props.events || [];
    const palette = props.palette;

    const activityFeedStyles = {
      shell: {
        border: '1px solid ' + palette.line,
        background: palette.panel,
        padding: '14px',
        display: 'grid',
        alignContent: 'start',
        gap: '10px'
      },
      title: {
        fontFamily: 'Libre Bodoni, serif',
        fontSize: '30px',
        lineHeight: 1,
        marginBottom: '2px'
      },
      stream: {
        display: 'grid',
        gap: '8px',
        maxHeight: '430px',
        overflowY: 'auto',
        paddingRight: '2px'
      },
      eventCard: function (severity) {
        const severityToneMap = {
          critical: palette.accent,
          warn: palette.muted,
          success: palette.ink,
          info: palette.ink
        };

        return {
          border: '1px solid ' + palette.line,
          background: 'rgba(173,63,20,0.04)',
          padding: '10px 10px 9px',
          display: 'grid',
          gap: '5px',
          borderLeft: '3px solid ' + (severityToneMap[severity] || palette.line)
        };
      },
      eventMeta: {
        fontSize: '10px',
        color: palette.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.14em'
      },
      eventText: {
        fontSize: '13px',
        lineHeight: 1.45
      }
    };

    return React.createElement(
      'section',
      { style: activityFeedStyles.shell },
      React.createElement('h3', { style: activityFeedStyles.title }, title),
      React.createElement(
        'div',
        { style: activityFeedStyles.stream },
        events.map(function (eventItem, eventIndex) {
          const timestamp = eventItem[0];
          const message = eventItem[1];
          const severity = eventItem[2] || 'info';

          return React.createElement(
            'article',
            {
              key: 'event-' + eventIndex,
              style: activityFeedStyles.eventCard(severity)
            },
            React.createElement(
              'div',
              { style: activityFeedStyles.eventMeta },
              timestamp + ' · ' + severity
            ),
            React.createElement('div', { style: activityFeedStyles.eventText }, message)
          );
        })
      )
    );
  }

  Object.assign(window.NP, { ActivityFeed: ActivityFeed });
})();

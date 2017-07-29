const log = require('./utils/log');

function setupSlackBot(config) {
  if (!config.slack.active) {
    return null;
  }
  const Bot = require('slackbots');
  const slackBot = new Bot({
    name: config.slack.settings.username,
    token: config.slack.token,
  });
  log('Slack Bot is currently enabled.', 'info');
  slackBot.on('start', function() {
    slackBot.postMessageToChannel(
      config.slack.channel,
      'Trimalchio is currently active (▰˘◡˘▰)',
      config.slack.settings
    );
  });
  slackBot.on('error', function() {
    log(
      'error',
      'An error occurred while connecting to Slack, please try again.'
    );
    process.exit();
  });

  return slackBot;
}

module.exports = {
  setupSlackBot,
};

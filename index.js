var fs = require('fs');
var menu = require('node-menu');

const log = require('./utils/log');
const { loadConfig } = require('./config');
const { setupSlackBot } = require('./slack');

// INIT PROXIES - NEED TO LOAD PROXIES
var proxies = [];
var reader = require('readline').createInterface({
  input: fs.createReadStream('proxies.txt'),
});

reader.on('line', line => {
  proxies.push(formatProxy(line));
});

function formatProxy(str) {
  // TODO: format is ip:port:user:pass
  let data = str.split(':');

  if (data.length === 2) {
    return 'http://' + data[0] + ':' + data[1];
  } else if (data.length === 4) {
    return 'http://' + data[2] + ':' + data[3] + '@' + data[0] + ':' + data[1];
  } else {
    console.log('Unable to parse proxy');
    return null;
  }
}

function startMenu(slackBot, config) {
  var customHeader = `
                        888            d8b                        888          888      d8b
                        888            Y8P                        888          888      Y8P
                        888                                       888          888
                        888888 888d888 888 88888b.d88b.   8888b.  888  .d8888b 88888b.  888  .d88b.
                        888    888P"   888 888 "888 "88b     "88b 888 d88P"    888 "88b 888 d88""88b
                        888    888     888 888  888  888 .d888888 888 888      888  888 888 888  888
                        Y88b.  888     888 888  888  888 888  888 888 Y88b.    888  888 888 Y88..88P
                         "Y888 888     888 888  888  888 "Y888888 888  "Y8888P 888  888 888  "Y88P"

                                                  github.com/dzt/trimalchio

  `;
  menu
    .addItem('Basic Mode', function() {
      log(`Looking for Keyword(s) matching "${config.keywords}"`);
      startBasicMode(slackBot, config);
      menu.resetMenu();
    })
    .addItem('Early Link Mode', function() {
      log(
        'Feature not yet available at the moment. Sorry for the inconvenience.',
        'error'
      );
      process.exit(1);
    })
    .addItem('Restock Mode', function() {
      log(
        'Feature not yet available at the moment. Sorry for the inconvenience.',
        'error'
      );
      process.exit(1);
    })
    .addItem('Captcha Harvester', function() {
      log(
        'Feature not yet available at the moment. Sorry for the inconvenience.',
        'error'
      );
      process.exit(1);
    })
    .addItem('Scheduler', function() {
      log(
        'Feature not yet available at the moment. Sorry for the inconvenience.',
        'error'
      );
      process.exit(1);
    })
    .addItem('Proxies', function() {
      log(
        'Feature not yet available at the moment. Sorry for the inconvenience.',
        'error'
      );
      process.exit(1);
    })
    .customHeader(function() {
      console.log('\x1b[36m%s\x1b[0m', customHeader);
    })
    .disableDefaultPrompt()
    .start();

  require('console-stamp')(console, {
    colors: {
      stamp: 'yellow',
      label: 'cyan',
      metadata: 'green',
    },
  });
}

var index = 0;

const { pay } = require('./trimalchio/pay');
const { findItem, selectStyle } = require('./trimalchio/findItem');

function startBasicMode(slackBot, config) {
  if (index >= proxies.length) {
    index = 0;
  }

  findItem(config, slackBot, proxies[index], function(err, res) {
    if (err) {
      setTimeout(() => {
        return startBasicMode();
      }, 10000); // delay
    } else {
      selectStyle(config, slackBot, res, (match, styleID) => {
        pay(config, slackBot, match, styleID);
      });
    }
  });
}

function init() {
  loadConfig(config => {
    const slackBot = setupSlackBot(config);
    startMenu(slackBot, config);
  });
}

init();

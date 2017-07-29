var fs = require('fs');
const prompt = require('./utils/prompt');
const log = require('./utils/log');

function loadConfig(cb) {
  if (fs.existsSync('./config.json')) {
    log(
      'Found an existing config.json, using data from file for current process.',
      'warning'
    );
    const config = require('./config.json');
    cb(config);
  } else {
    setupConfig(config => {
      cb(config);
    });
  }
}

function setupConfig(cb) {
  prompt.get(
    [
      {
        name: 'base_url',
        required: true,
        description:
          'Store URL (ex: "https://store.illegalcivilization.com" or provide sitemap url)',
      },
      {
        name: 'keywords',
        required: true,
        description: 'Keyword(s)',
      },
      {
        name: 'sizeStyle1',
        required: false,
        description:
          'Usually is the size of the item but in some cases it could be the style. (Optional)',
      },
      {
        name: 'sizeStyle2',
        required: false,
        description:
          'Usually is left blank, but if not it is usually the style of the item. (Optional)',
      },
      {
        name: 'ccn',
        required: true,
        description: 'CC Number (with spaces)',
      },
      {
        name: 'nameOnCard',
        required: true,
        description: 'Name on CC',
      },
      {
        name: 'month',
        type: 'integer',
        required: true,
        description: 'CC Exp Month (ex: 3, 6, 12)',
      },
      {
        name: 'year',
        type: 'integer',
        required: true,
        description: 'CC Exp Year (ex: 2019)',
      },
      {
        name: 'ccv',
        required: true,
        description: 'CVV Number on Card (ex: 810)',
      },
      {
        name: 'firstName',
        required: true,
        description: 'First Name',
      },
      {
        name: 'lastName',
        required: true,
        description: 'Last Name',
      },
      {
        name: 'address',
        required: true,
        description: 'Address',
      },
      {
        name: 'city',
        required: true,
        description: 'City',
      },
      {
        name: 'state',
        required: true,
        description: 'State (ex: MA, CA, NY)',
      },
      {
        name: 'zipCode',
        required: true,
        description: 'Zip Code',
      },
      {
        name: 'phoneNumber',
        required: true,
        description: 'Phone Number (no spaces or symbols)',
      },
      {
        name: 'email',
        required: true,
        description: 'Email Address',
      },
      {
        name: 'shipping_pole_timeout',
        type: 'integer',
        required: true,
        description:
          'Timeout Delay (ms) for polling shipping Rates (Recommended: 2500)',
      },
    ],
    function(err, result) {
      var slack = {
        active: false,
        token: 'token goes here',
        channel: 'general',
        settings: {
          username: 'Trimalchio',
          icon_url: 'http://i.imgur.com/06ubORD.jpg',
        },
      };
      const ogKwValue = result.keywords;
      var ogSizeStyle1, ogSizeStyle2;
      if (result.sizeStyle1 == '') {
        ogSizeStyle1 = null;
      } else {
        ogSizeStyle1 = [result.sizeStyle1];
      }

      if (result.sizeStyle2 == '') {
        ogSizeStyle2 = null;
      } else {
        ogSizeStyle2 = [result.sizeStyle2];
      }

      result.sizeStyle1 = ogSizeStyle1;
      result.sizeStyle2 = ogSizeStyle2;
      result.keywords = [ogKwValue];
      result.paypal = false;
      result.slack = slack;
      result.show_stock = false;

      fs.writeFile('config.json', JSON.stringify(result, null, 4), function(
        err
      ) {
        if (err) {
          log(err, 'error');
        }
        cb(result);
        log('Config file generated! Starting process...');
      });
    }
  );
}

module.exports = {
  setupConfig,
  loadConfig,
};

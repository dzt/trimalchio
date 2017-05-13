require("console-stamp")(console, {
  colors: {
    stamp: "yellow",
    label: "white",
    metadata: "green"
  }
});

function log(msg, type) {
  switch (type) {
    case "warning":
      console.warn(msg);
      break;
    case "error":
      console.error(msg);
      break;
    case "info":
      console.info(msg);
      break;
    default:
      console.log(msg);
  }
}

var prompt = require('prompt');
var request = require('request');
var _ = require('underscore');
var cheerio = require('cheerio');
var fs = require('fs');
var config
  prompt.message = 'crapeyewear'
  var match,
    styleID;

  if (fs.existsSync('./config.json')) {
    log('Found an existing config.json, using data from file for current process.', 'warning');
    config = require('./config.json');
    start();
    log(`Looking for Keyword(s) matching "${config.keywords}"`);
  } else {
    prompt.get([
      {
        name: 'keywords',
        required: true,
        description: 'Keyword(s)'
      }, {
        name: 'ccn',
        required: true,
        description: 'CC Number (with spaces)'
      }, {
        name: 'nameOnCard',
        required: true,
        description: 'Name on CC'
      }, {
        name: 'month',
        required: true,
        description: 'CC Exp Month (ex: 03)'
      }, {
        name: 'year',
        required: true,
        description: 'CC Exp Year (ex: 2019)'
      }, {
        name: 'ccv',
        required: true,
        description: 'CVV Number on Card (ex: 810)'
      }, {
        name: 'firstName',
        required: true,
        description: 'First Name'
      }, {
        name: 'lastName',
        required: true,
        description: 'Last Name'
      }, {
        name: 'address',
        required: true,
        description: 'Address'
      }, {
        name: 'city',
        required: true,
        description: 'City'
      }, {
        name: 'state',
        required: true,
        description: 'State (ex: MA, CA, NY)'
      }, {
        name: 'zipCode',
        required: true,
        description: 'Zip Code'
      }, {
        name: 'phoneNumber',
        required: true,
        description: 'Phone Number (no spaces or symbols)'
      }
    ], function(err, result) {
      config = result
      fs.writeFile('config.json', JSON.stringify(result, null, 4), function(err) {
        log('Config file generated! Starting process...');
        log(`Looking for Keyword(s) matching "${config.keywords}"`);
        start();
      });
    });
  }

  function start() {
    findItem(config.keywords, function(err, res) {
      if (err) {
        return start();
      } else {
        match = res;
        selectStyle();
      }
    });
  }

  function findItem(kw, cb) {
    request({
      url: 'https://www.crapeyewear.com/products.json',
      method: 'get',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2 like Mac OS X) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0 Mobile/14C92 Safari/602.1'
      }
    }, function(err, res, body) {
      if (err) {
        return cb(err, null);
      } else {
        var products = JSON.parse(body);
        for (var i = 0; i < products.products.length; i++) {
          var name = products.products[i].title;
          if (name.indexOf(config.keywords) > -1) {
            match = products.products[i];
            log(`Item Found! - "${name}"`);
            return cb(null, products.products[i]);
            break;
          } else {
            continue;
          }
        }
        return cb('Match not found yet...', null);
      }
    });
  }

  function selectStyle() {
    for (var i = 0; i < match.variants.length; i++) {
      var styleName = match.variants[i].option1;
      log(`Style Choice #${i + 1}: "${styleName}"`);
    }

    prompt.get([
      {
        name: 'styleSelect',
        required: true,
        description: 'Select a Style # (ex: "1")'
      }
    ], function(err, result) {
      var choice = parseInt(result.styleSelect);
      styleID = match.variants[choice - 1].id;
      log(`You selected - "${match.variants[choice - 1].option1}" (${styleID})`);
      log('Checking out your item!')
      pay();
    });
  }

  function pay() {
    request({
        url: `https://www.crapeyewear.com/products/${match.handle}`,
        method: 'get'
    }, function(err, res, body) {
      
    });
  }

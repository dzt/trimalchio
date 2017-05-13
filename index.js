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
var j = require('request').jar();
var states = require('./states.json');
var request = require('request').defaults({timeout: 30000, jar: j});
var _ = require('underscore');
var cheerio = require('cheerio');
var phoneFormatter = require('phone-formatter');
var fs = require('fs');
prompt.message = 'crapeyewear';
var match,
  styleID,
  config,
  storeID,
  checkoutID;

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
    }, {
      name: 'email',
      required: true,
      description: 'Email Address'
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
      var foundItems = [];
      for (var i = 0; i < products.products.length; i++) {
        var name = products.products[i].title;
        if (name.indexOf(config.keywords) > -1) {
          foundItems.push(products.products[i]);
        }
      }

      if (foundItems.length > 0) {
        if (foundItems.length === 1) {
          log(`Item Found! - "${foundItems[0].title}"`);
          match = foundItems[0];
          return cb(null, foundItems[0]);
        } else {
          log(`We found more than 1 item matching with the keyword(s) "${config.keywords}" please select the item.\n`, 'warning');
          for (var i = 0; i < foundItems.length; i++) {
            log(`Product Choice #${i + 1}: "${foundItems[i].title}"`);
          }

          prompt.get([
            {
              name: 'productSelect',
              required: true,
              description: 'Select a Product # (ex: "2")'
            }
          ], function(err, result) {
            var choice = parseInt(result.productSelect);
            match = foundItems[choice - 1];
            log(`You selected - "${match.title}`);
            return cb(null, match);
          });

        }
      } else {
        return cb('Match not found yet...', null);
      }

    }
  });
}

function selectStyle() {
  for (var i = 0; i < match.variants.length; i++) {
    var styleName = match.variants[i].option1;
    log(`Style/Size Choice #${i + 1}: "${styleName}"`);
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
    pay();
  });
}

function pay() {
  request({
    url: 'https://www.crapeyewear.com/products/' + match.handle,
    followAllRedirects: true,
    method: 'get',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2 like Mac OS X) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0 Mobile/14C92 Safari/602.1'
    }
  }, function(err, res, body) {});

  request({
    url: 'https://www.crapeyewear.com/cart/add.js',
    followAllRedirects: true,
    method: 'post',
    headers: {
      'Origin': 'https://www.crapeyewear.com',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2 like Mac OS X) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0 Mobile/14C92 Safari/602.1',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://www.crapeyewear.com/products/' + match.handle,
      'Accept-Language': 'en-US,en;q=0.8'
    },
    formData: {
      'id': styleID,
      'qty': '1'
    }
  }, function(err, res, body) {
    request({
      url: 'https://www.crapeyewear.com/cart',
      followAllRedirects: true,
      method: 'get',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2 like Mac OS X) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0 Mobile/14C92 Safari/602.1'
      }
    }, function(err, res, body) {
      log('Added to cart!');
      log('Checking out your item!');
      request({
        url: 'https://www.crapeyewear.com/cart',
        followAllRedirects: true,
        method: 'post',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2 like Mac OS X) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0 Mobile/14C92 Safari/602.1'
        },
        formData: {
          'quantity': '1',
          'checkout': 'Checkout'
        }
      }, function(err, res, body) {

        var $ = cheerio.load(body);
        checkoutID = $('.edit_checkout').attr('action').split('checkouts/')[1];
        storeID = $('.edit_checkout').attr('action').split('/')[1];
        var auth_token = $('input[name=authenticity_token]').attr('value');
        log(`Store ID: ${storeID}`)
        log(`Checkout ID: ${checkoutID}`)
        return input(auth_token);
      });
    });
  });
}

function input(auth_token) {
  log(`Checkout URL: https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`)
  request({
    url: `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
    followAllRedirects: true,
    headers: {
      'Origin': 'https://www.crapeyewear.com',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2 like Mac OS X) AppleWebKit/602.3.12 (KHTML, like Gecko) Version/10.0 Mobile/14C92 Safari/602.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://www.crapeyewear.com/',
      'Host': 'www.crapeyewear.com',
      'Accept-Language': 'en-US,en;q=0.8'
    },
    method: 'get',
    qs: {
      'utf8': '✓',
      '_method': 'patch',
      'authenticity_token': auth_token,
      'previous_step': 'contact_information',
      'checkout[email]': config.email,
      'checkout[shipping_address][first_name]': config.firstName,
      'checkout[shipping_address][last_name]': config.lastName,
      'checkout[shipping_address][company]': '',
      'checkout[shipping_address][address1]': config.address,
      'checkout[shipping_address][address2]': '',
      'checkout[shipping_address][city]': config.city,
      'checkout[shipping_address][country]': 'United States',
      'checkout[shipping_address][province]': config.state,
      'checkout[shipping_address][province]': '',
      'checkout[shipping_address][province]': states[config.state],
      'checkout[shipping_address][zip]': config.zipCode,
      'checkout[shipping_address][phone]': config.phoneNumber,
      'checkout[remember_me]': '',
      'checkout[remember_me]': '0',
      'checkout[client_details][browser_width]': '979',
      'checkout[client_details][browser_height]': '631',
      'checkout[client_details][javascript_enabled]': '1',
      'step': 'contact_information'
    }
  }, function(err, res, body) {
    var $ = cheerio.load(body);
    return ship($('input[name=authenticity_token]').attr('value'));
  });
}

function ship(auth_token) {
  request({
    url: `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`, followAllRedirects: true, // redirects to https checkout
    method: 'post',
    headers: {
      'Origin': 'https://www.crapeyewear.com',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8',
      'Referer': `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
    },
    formData: {
      'utf8': '✓',
      '_method': 'patch',
      'authenticity_token': auth_token,
      'button': '',
      'checkout[email]': config.email,
      'checkout[shipping_address][first_name]': config.firstName,
      'checkout[shipping_address][last_name]': config.lastName,
      'checkout[shipping_address][company]': '',
      'checkout[shipping_address][address1]': config.address,
      'checkout[shipping_address][address2]': '',
      'checkout[shipping_address][city]': config.city,
      'checkout[shipping_address][country]': 'United States',
      'checkout[shipping_address][province]': states[config.state],
      'checkout[shipping_address][zip]': config.zipCode,
      'checkout[shipping_address][phone]': phoneFormatter.format(config.phoneNumber, "(NNN) NNN-NNNN"),
      'checkout[remember_me]': '0',
      'checkout[client_details][browser_width]': '979',
      'checkout[client_details][browser_height]': '631',
      'checkout[client_details][javascript_enabled]': '1',
      'previous_step': 'contact_information',
      'step': 'shipping_method'
    }
  }, function(err, res, body) {

    var $ = cheerio.load(body);
    var auth_token = $('input[name=authenticity_token]').attr('value');

    request({
      url: `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`, followAllRedirects: true, // redirects to https checkout
      method: 'post',
      headers: {
        'Origin': 'https://www.crapeyewear.com',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.8',
        'Referer': `https://www.crapeyewear.com/${storeID}/checkouts/${checkoutID}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
      },
      formData: {
        '_method': 'patch',
        'authenticity_token': auth_token,
        'button': '',
        'checkout[shipping_rate][id]': 'shopify-FREE%20SHIPPING%20-%20USPS%20Priority%20Mail-0.00',
        'previous_step': 'shipping_method',
        'step': 'payment_method',
        'utf8': '✓'
      }
    }, function(err, res, body) {
      console.log(body);
    });
  });
}

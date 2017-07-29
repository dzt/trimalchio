var prompt = require('prompt');

prompt.message = 'Input';

prompt.start({
  noHandleSIGINT: true,
});

module.exports = prompt;

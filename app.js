var exec = require('child_process').exec;

var pythonExec = function(str, arg) {
  var cmd = 'python ' + __dirname + '/' + str + '.py "' + arg + '"';
  exec(cmd, function(error, stdout, stderr) {
    process.stdout.write(stdout);
  });
};

var fadeLights = function(start, end, timeout, cb) {
  var begin = (new Date()).getTime();
  var step = (end - start) / (timeout / 10);
  strength = start;
  var loop = function() {
    pythonExec('lights', strength);
    if (strength >= end) {
      if (cb) {
        cb();
      }
      return;
    }
    strength += step;
    setTimeout(function() {
      loop();
    }, 10);
  }

  loop();
};

var displayOnScreen = function(str) {
  pythonExec('screen', str);
  process.stdout.write( str + '\n' );
};

var api = require('./api');
var printer = require('./print');
var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
stdin.setRawMode( true );

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();

// i don't want binary, do you?
stdin.setEncoding( 'UTF-8' );

var waiting = false;
var typed = '';

var formatTestFail = function(test) {
  var err = '';
  switch(test.testName) {
    case 'browserDetection':
      err += 'You are checking user agents.\n';
      for (var i in test.data) {
        if (! test.data[i].passed) {
          for (var j in test.data[i].data) {
            if (! test.data[i].data[j].passed) {
              if (i === 'comments') {
                err += 'You are using browser specific comments on line ' + test.data[i].data.lineNumber + '\n';
              }
              else {
                err += i + ': ' + test.data[i].data[j].url + ' line:' + test.data[i].data[j].lineNumber + ' ' + test.data[i].data[j].pattern + '\n';
              }
            }
          }
        }
      }
      break;
    case 'cssprefixes':
      err += 'You are not using standard css properties.\n';
      for (var i in test.data) {
        for (var j in test.data[i].selectors) {
          err += test.data[i].cssFile + ' line:' +test.data[i].selectors[j].lineNumber + ' ' + test.data[i].selectors[j].selector + ': ' + test.data[i].selectors[j].styles.join(', ') + '\n';
        }
      }
      break;
    case 'jslibs':
      err += 'You should keep your javascript libraries updated.\n';
      for (var i in test.data) {
        if (test.data[i].needsUpdate) {
          err += test.data[i].name + ' is currently using version ' + test.data[i].version + ', you should update it to at least ' + test.data[i].minVersion + '\n';
        }

      }
      break;
    default:
      err = JSON.stringify(test.data);
  }
  return err;
  return test.data;
};

var sendTest = function() {
  var toPrint = '';
  console.log('RUNNING TESTS on ' + typed);
  var isHTTPS = false;
  pythonExec('smoke', 10);
  api.test(typed, isHTTPS, function(d, isError) {
    if (isError) {
      displayOnScreen('No internet?');
      typed = '';
      return;
    }
    if (d.message) {
      displayOnScreen('Not a valid URL');
      typed = '';
      return;
    }
    // console.log(d);
    var iterator = 1;
    for (var i in d.results) {
      if (d.results[i].passed) {
        toPrint += '\n\nTEST ' + iterator + ' PASSED (' + i + ')\n';
      }
      else {
        toPrint += '\n\nTEST ' + iterator + ' FAILED (' + i + ')\n';
        toPrint += formatTestFail(d.results[i]);
      }
      iterator++;
    }

    console.log('COMPLETED TESTS');
    printer.print(toPrint);
    typed = '';
  });
};

// typed = 'nfb.ca';
// sendTest();


var displayString = function() {
  displayOnScreen( typed );
}



// on any data into stdin
stdin.on( 'data', function( key ){

  if( key.charCodeAt(0) === 127 ){
    typed = typed.substring(0, typed.length - 1);
    displayString();
    return;
  }

  // ctrl-c ( end of text )
  if (key === "\u000d") {
    sendTest();
    return;
  }
  if ( key === '\u0003' ) {
    process.exit();
    return;
  }

  pythonExec('lights', 127);
  setTimeout(function() {
    pythonExec('lights', 0);
  }, 500);

  typed += key;
  displayString();

});


displayOnScreen('Ready...');

fadeLights(0, 128, 3000, function() {
  fadeLights(128, 0, 3000);
});

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.count = count;
exports.csvCount = csvCount;
exports.bltCount = bltCount;

require('babel-polyfill');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _cliTable = require('cli-table');

var _cliTable2 = _interopRequireDefault(_cliTable);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _csv = require('csv');

var _csv2 = _interopRequireDefault(_csv);

var _seedrandom = require('seedrandom');

var _seedrandom2 = _interopRequireDefault(_seedrandom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var VERSION = 'v16.05.1';

var logging = true;
var log_ = function log_() {
  var _console;

  return logging ? (_console = console).log.apply(_console, arguments) : {};
};
var logTrue = function logTrue() {
  var _console2;

  return (_console2 = console).log.apply(_console2, arguments);
};

var prec = 6;

var rng = Math.random();

function populate() {
  var populated = [];

  for (var _len = arguments.length, votes = Array(_len), _key = 0; _key < _len; _key++) {
    votes[_key] = arguments[_key];
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = votes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var vote = _step.value;

      Array(vote[0]).fill(vote[1]).forEach(function (v) {
        return populated.push(v);
      });
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return populated;
}

Number.prototype.round = function (places) {
  return +(Math.round(this + 'e+' + places) + 'e-' + places);
};

function getValues(object) {
  var values = new Array();
  for (var prop in object) {
    values.push(object[prop]);
  }
  return values;
}

function getMin(array) {
  return array.reduce(function (a, b) {
    return Math.min(a, b);
  });
}

function pick(object) {
  var o = {};

  for (var _len2 = arguments.length, fields = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    fields[_key2 - 1] = arguments[_key2];
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = fields[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var field = _step2.value;

      Object.assign(o, _defineProperty({}, field, object[field]));
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return o;
}

function removeBlanks(object) {
  return pick.apply(undefined, [object].concat(_toConsumableArray(Object.keys(object).filter(function (key) {
    return object[key] || object[key] === 0;
  }))));
}

function withdraw(ballots) {
  var votes = ballots.map(function (v) {
    return v.slice();
  });

  for (var _len3 = arguments.length, candidates = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    candidates[_key3 - 1] = arguments[_key3];
  }

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    var _loop = function _loop() {
      var candidate = _step3.value;

      votes.forEach(function (val, ind, arr) {
        votes[ind] = val.filter(function (v) {
          return v !== candidate;
        });
      });
    };

    for (var _iterator3 = candidates[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      _loop();
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return votes;
}

function countPref(pref, cand, votes) {
  var count = 0;
  votes.forEach(function (v, i, arr) {
    if (v[pref - 1] === cand) count++;
  });
  return count;
}

function getPref(pref, cand, votes) {
  var count = [];
  votes.forEach(function (v, i, arr) {
    if (v[pref - 1] === cand) count.push(i);
  });
  return count;
}

function round(votes, values, seats, quota, hopefuls, eliminated, elected, counts) {
  var surplus = arguments.length <= 8 || arguments[8] === undefined ? {} : arguments[8];
  var ron = arguments.length <= 9 || arguments[9] === undefined ? '' : arguments[9];

  if (elected.length === seats) {
    log_('<all vacancies filled>');
    logTrue('********** COUNTING ENDS **********');
    return {
      elected: elected,
      counts: counts
    };
  }

  if (hopefuls.length <= seats - elected.length) {
    log_('<remaining candidates can fill all vacancies>');
    hopefuls.forEach(function (v) {
      elected.push(v);
      log_(_chalk2.default.white.bgGreen('----- elected', v, '-----'));
    });
    logTrue('********** COUNTING ENDS **********');
    return {
      elected: elected,
      counts: counts
    };
  }

  log_('########## ROUND', counts.length + 1, '##########');

  var distributed = {};
  if (Object.keys(surplus).length > 0) {
    distributed = distributeSurplus(votes, values, counts[counts.length - 1], surplus);
    surplus = {};
  }

  var roundCount = {};
  var roundElected = [];
  var hasElected = false;

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    var _loop2 = function _loop2() {
      var v = _step4.value;

      var count = 0;
      if (counts.length === 0) {
        count = countPref(1, v, votes);
      } else {
        count = distributed[v];
      }
      roundCount[v] = count;
      if (count >= quota) {
        roundElected.push(v);
        elected.push(v);
        hopefuls = hopefuls.filter(function (h) {
          return h !== v;
        });
      }
    };

    for (var _iterator4 = hopefuls[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      _loop2();
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  counts.push(roundCount);
  log_('+++++ round count +++++');
  roundCountTable(roundCount);

  var excluded = [].concat(_toConsumableArray(elected), _toConsumableArray(eliminated));
  if (roundElected.length === 0) {
    (function () {
      var elimCand = eliminate(votes, values, '', roundCount, hopefuls, excluded, surplus, counts, ron);
      eliminated.push(elimCand);
      hopefuls = hopefuls.filter(function (v) {
        return v !== elimCand;
      });
      log_(_chalk2.default.gray.bgYellow('----- eliminated', elimCand, '-----'));
    })();
  } else {
    roundElected.forEach(function (v) {
      log_(_chalk2.default.white.bgGreen('----- elected', v, '-----'));
      eliminate(votes, values, v, roundCount, hopefuls, excluded, surplus, counts, ron, roundCount[v] - quota);
    });
  }

  if (counts.length < 20) {} else {
    return;
  }
  return round(votes, values, seats, quota, hopefuls, eliminated, elected, counts, surplus, ron);
}

function countSurplus(votes, values, candidate, hopefuls, excluded) {
  var surplus = {};
  var transferred = votes.map(function (val, ind, arr) {
    if (val[0] === candidate) return val.slice();
    return [];
  });
  var total = transferred.length;

  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    var _loop3 = function _loop3() {
      var exclude = _step5.value;

      transferred.forEach(function (val, ind, arr) {
        transferred[ind] = val.filter(function (v) {
          return v !== exclude;
        });
      });
    };

    for (var _iterator5 = excluded[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      _loop3();
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = hopefuls[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var hopeful = _step6.value;

      surplus[hopeful] = getPref(1, hopeful, transferred);
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6.return) {
        _iterator6.return();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }

  return {
    dist: surplus
  };
}

function distributeSurplus(votes, values, lastCounts, surplus) {
  var count = Object.assign({}, lastCounts);
  var totalTransferred = {};
  for (var _candidate in surplus) {
    if (surplus.hasOwnProperty(_candidate)) {
      totalTransferred = 0;
      var tableCount = {};
      var dist = surplus[_candidate].dist;
      if (surplus[_candidate].surplus < count[_candidate]) {
        if (count[_candidate] > 0) {
          var value = surplus[_candidate].surplus / count[_candidate];
          for (var transfer in dist) {
            if (dist.hasOwnProperty(transfer)) {
              var _iteratorNormalCompletion7 = true;
              var _didIteratorError7 = false;
              var _iteratorError7 = undefined;

              try {
                for (var _iterator7 = dist[transfer][Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                  var nextPref = _step7.value;

                  values[nextPref] *= value;
                }
              } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion7 && _iterator7.return) {
                    _iterator7.return();
                  }
                } finally {
                  if (_didIteratorError7) {
                    throw _iteratorError7;
                  }
                }
              }
            }
          }
        }
      }

      log_(_chalk2.default.magenta('----- distributing surplus -----'));
      for (var _transfer in dist) {
        if (dist.hasOwnProperty(_transfer)) {
          tableCount[_transfer] = 0;
          var _iteratorNormalCompletion8 = true;
          var _didIteratorError8 = false;
          var _iteratorError8 = undefined;

          try {
            for (var _iterator8 = dist[_transfer][Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
              var _nextPref = _step8.value;

              count[_transfer] += values[_nextPref];

              tableCount[_transfer] += values[_nextPref];
              totalTransferred += values[_nextPref];
            }
          } catch (err) {
            _didIteratorError8 = true;
            _iteratorError8 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
              }
            } finally {
              if (_didIteratorError8) {
                throw _iteratorError8;
              }
            }
          }

          count[_transfer] = count[_transfer].round(prec);
        }
      }

      log_(_chalk2.default.bold(_candidate));
      for (var _transfer2 in tableCount) {
        if (tableCount[_transfer2]) log_('- transfers', _chalk2.default.underline(tableCount[_transfer2]), 'vote(s) to', _chalk2.default.underline(_transfer2));
      }

      log_('-', _chalk2.default.bold('Transfer in total:'), _chalk2.default.underline(totalTransferred), _chalk2.default.bold('Exhausted:'), _chalk2.default.underline(surplus[_candidate].surplus - totalTransferred));
    }
  }
  return count;
}

function eliminate(votes, values, candidate, roundCount, hopefuls, excluded, surplus, counts, ron) {
  var surplusVotes = arguments.length <= 9 || arguments[9] === undefined ? null : arguments[9];

  if (candidate === '') {
    (function () {
      candidate = Object.keys(roundCount).filter(function (v) {
        return v !== ron;
      });
      var minVotes = 0;
      if (!ron) {
        minVotes = getMin(getValues(roundCount));
      } else {
        var roundCount_ = Object.assign({}, roundCount);
        if (roundCount_.hasOwnProperty(ron)) {
          delete roundCount_[ron];
        } else {
          console.error(_chalk2.default.bold.red('***** RON candidate not found *****'));
        }
        minVotes = getMin(getValues(roundCount_));
      }
      var potentials = [];
      candidate.forEach(function (val, ind) {
        if (roundCount[val] === minVotes) {
          potentials.push(ind);
        }
      });
      if (potentials.length <= 0) console.error(_chalk2.default.bold.red('********** unable to continue elimination **********'));
      if (potentials.length === 1) {
        candidate = candidate[potentials[0]];
      } else {
        var potentialCands = [];
        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
          for (var _iterator9 = potentials[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var ind = _step9.value;

            potentialCands.push(candidate[ind]);
          }
        } catch (err) {
          _didIteratorError9 = true;
          _iteratorError9 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion9 && _iterator9.return) {
              _iterator9.return();
            }
          } finally {
            if (_didIteratorError9) {
              throw _iteratorError9;
            }
          }
        }

        candidate = breakTie(potentialCands, counts);
      }
      excluded.push(candidate);
      hopefuls = hopefuls.filter(function (v) {
        return v !== candidate;
      });
    })();
  }

  surplus[candidate] = countSurplus(votes, values, candidate, hopefuls, excluded);
  surplus[candidate].surplus = surplusVotes !== null ? surplusVotes : roundCount[candidate];

  votes.splice.apply(votes, [0, votes.length].concat(_toConsumableArray(withdraw(votes, candidate))));

  return candidate;
}

function breakTie(potentials, counts) {
  log_('*a tie!*');
  if (counts.length > 1) {
    var _ret6 = function () {
      var lastCount = counts[counts.length - 2];
      var lastCounts = pick.apply(undefined, [lastCount].concat(_toConsumableArray(potentials)));
      var minVotes = getMin(getValues(lastCounts));
      var potentialsTie = [];
      potentials.forEach(function (val, ind) {
        if (lastCounts[val] === minVotes) {
          potentialsTie.push(ind);
        }
      });
      if (potentialsTie.length <= 0) console.error('********** unable to continue elimination **********');
      if (potentialsTie.length === 1) {
        var _against = potentials[potentialsTie[0]];
        log_('----- tie broken backwards against', _against, ' -----');
        return {
          v: _against
        };
      }
      var potentialCands = [];
      for (var ind in potentialsTie) {
        potentialCands.push(potentials[ind]);
      }
      return {
        v: breakTie(potentialCands, counts.slice(0, -1))
      };
    }();

    if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
  }

  var against = potentials[Math.floor(rng() * potentials.length)];
  log_('----- tie randomly broken against', against, '-----');
  return against;
}

function roundCountTable(roundCount) {
  var table = new _cliTable2.default();
  for (var _candidate2 in roundCount) {
    table.push(_defineProperty({}, _chalk2.default.cyan.bold(_candidate2), roundCount[_candidate2]));
  }
  return log_(table.toString());
}

function countsTable(counts, elected) {
  var isElected = function isElected(candidate) {
    return elected.includes(candidate) ? _chalk2.default.bold.green('Y') : _chalk2.default.bold.red('X');
  };
  var table = new _cliTable2.default({
    head: [_chalk2.default.blue.bold('Round')].concat(_toConsumableArray(Array.from(new Array(counts.length), function (x, i) {
      return _chalk2.default.blue.bold(i + 1);
    })), [_chalk2.default.bold.green('Elected')])
  });

  var _loop4 = function _loop4(_candidate3) {
    table.push(_defineProperty({}, _chalk2.default.cyan.bold(_candidate3), [].concat(_toConsumableArray(Array.from(new Array(counts.length), function (x, i) {
      return _candidate3 in counts[i] ? counts[i][_candidate3] : isElected(_candidate3);
    })), [isElected(_candidate3)])));
  };

  for (var _candidate3 in counts[0]) {
    _loop4(_candidate3);
  }

  return log_(table.toString());
}

function getCandidates(votes) {
  var _ref;

  return [].concat(_toConsumableArray(new Set((_ref = []).concat.apply(_ref, _toConsumableArray(votes)))));
}

function count(_ref2) {
  var votes = _ref2.votes;
  var candidates = _ref2.candidates;
  var withdrawn = _ref2.withdrawn;
  var seats = _ref2.seats;
  var quota = _ref2.quota;
  var log = _ref2.log;
  var ron = _ref2.ron;
  var title = _ref2.title;
  var precision = _ref2.precision;
  var seed = _ref2.seed;

  if (log === false) {
    logging = false;
  }

  ron = ron || '';
  title = title || '';
  prec = precision || 6;

  if (seed) {
    rng = (0, _seedrandom2.default)(seed);
  }

  logTrue(_chalk2.default.underline('stvCount', VERSION, '(c) Z. Tong Zhang'));
  logTrue(title);
  logTrue('********** COUNTING STARTS **********');
  if (withdrawn) {
    votes = withdraw.apply(undefined, [votes].concat(_toConsumableArray(withdrawn)));
    log_(_chalk2.default.red.apply(_chalk2.default, ['-----'].concat(_toConsumableArray(withdrawn), ['withdrawn -----'])));
  }

  candidates = candidates || getCandidates(votes);

  if (quota < 0) quota = Math.floor(votes.length / (seats + 1) + 1);
  var values = new Array(votes.length).fill(1);
  var result = round(votes, values, seats, quota, candidates, [], [], [], {}, ron);

  logTrue(_chalk2.default.bold(title));
  log_('votes #:', votes.length);
  log_('quota:', quota);
  countsTable(result.counts, result.elected);

  var elected = new _cliTable2.default({ head: [_chalk2.default.bold.green('ELECTED')] });
  result.elected.forEach(function (v) {
    return elected.push([v]);
  });
  log_(elected.toString());

  return result;
}

function csvCount(csvData, options) {
  var parser = _csv2.default.parse({ columns: true }, function (err, result) {
    if (err) console.error(err.message);
    var votes = [];
    var ind = 0;
    var _iteratorNormalCompletion10 = true;
    var _didIteratorError10 = false;
    var _iteratorError10 = undefined;

    try {
      var _loop5 = function _loop5() {
        var vote = _step10.value;

        vote = removeBlanks(vote);
        var voteArray = Object.keys(vote).sort(function (a, b) {
          return vote[a] - vote[b];
        });
        var temp = [];
        var _iteratorNormalCompletion11 = true;
        var _didIteratorError11 = false;
        var _iteratorError11 = undefined;

        try {
          for (var _iterator11 = voteArray[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
            var i = _step11.value;

            i && temp.push(i);
          }
        } catch (err) {
          _didIteratorError11 = true;
          _iteratorError11 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion11 && _iterator11.return) {
              _iterator11.return();
            }
          } finally {
            if (_didIteratorError11) {
              throw _iteratorError11;
            }
          }
        }

        voteArray = temp;
        votes[ind++] = voteArray;
      };

      for (var _iterator10 = result[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
        _loop5();
      }
    } catch (err) {
      _didIteratorError10 = true;
      _iteratorError10 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion10 && _iterator10.return) {
          _iterator10.return();
        }
      } finally {
        if (_didIteratorError10) {
          throw _iteratorError10;
        }
      }
    }

    options.votes = votes;
    count(options);
  });

  if (typeof csvData.resume === 'function') {
    csvData.resume().pipe(parser);
  } else if (typeof _csv2.default === 'string') {
    converter.fromString(csvData);
  } else {
    return console.error('Error: CSV stream or string needed');
  }
}

function bltCount(blt, options) {
  var bltToOpt = function bltToOpt(bltArray, opt) {
    opt.seats = bltArray[0][1];
    opt.title = bltArray[-1][0] || '';
    opt.candidates = [];
    for (var i = -1 - bltArray[0][0]; i < -1; i++) {
      opt.candidates.push(bltArray[i][0]);
    }

    var start = 1;
    var votes = [];
    if (bltArray[1][0] < 0) {
      opt.withdrawn = bltArray[1];
      start = 2;
    }
    var _iteratorNormalCompletion12 = true;
    var _didIteratorError12 = false;
    var _iteratorError12 = undefined;

    try {
      for (var _iterator12 = bltArray.slice(start, -1 - bltArray[0][0])[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
        var _vote = _step12.value;

        if (_vote.length > 1) {
          (function () {
            var ranking = [];
            _vote.slice(1, -1).forEach(function (candidate) {
              return ranking.push(opt.candidates[candidate - 1]);
            });
            votes.push([_vote[0], ranking]);
          })();
        }
      }
    } catch (err) {
      _didIteratorError12 = true;
      _iteratorError12 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion12 && _iterator12.return) {
          _iterator12.return();
        }
      } finally {
        if (_didIteratorError12) {
          throw _iteratorError12;
        }
      }
    }

    opt.votes = populate.apply(undefined, votes);
    return count(opt);
  };

  var csvOpt = {
    delimiter: ' ',
    trim: true
  };
  var parser = _csv2.default.parse(csvOpt, function (err, result) {
    if (err) console.error(err.message);
    bltToOpt(result, options);
  });

  if (typeof blt.resume === 'function') {
    blt.resume().pipe(parser);
  } else if (typeof blt === 'string') {
    parser.write(blt);
  } else {
    return console.error('Error: BLT stream or string needed');
  }
}
//# sourceMappingURL=all.js.map

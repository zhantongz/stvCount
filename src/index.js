const VERSION = 'v16.05.1'

import 'babel-polyfill';
import _ from 'lodash';
import chalk from 'chalk';
const Table = require('cli-table');

function populate(votes) {
  let populated = [];
  for (let vote of votes) {
    Array(vote[0]).fill(vote[1]).forEach(v => populated.push(v));
  }
  return populated;
}

Number.prototype.round = function(places) {
  return +(Math.round(this + 'e+' + places)  + 'e-' + places);
}

/**
 * A single transferrable vote, containing an array of names of candidates
 * (`string`s) in order of preference indicated, i.e. first-preference vote is
 * at index `0`.
 * @typedef {string[][]} vote
 */

/**
 * Counts a candidate's votes in a position on ranked ballot
 * @param {number} pref The position of preference at which the votes for the
 * candidate is counted, e.g. `pref = 1` to count first-preference votes
 * @param {string} cand Name of the candidate
 * @param {vote[]} votes Votes to be counted
 * @returns {number} Number of votes the candidate receives at the specified
 * position on the ballot
 */
function countPref(pref, cand, votes) {
  let count = 0;
  votes.forEach((v, i, arr) => {
    if (v[pref - 1] === cand) count++;
  });
  return count;
}

function getPref(pref, cand, votes) {
  let count = [];
  votes.forEach((v, i, arr) => {
    if (v[pref - 1] === cand) count.push(i);
  });
  return count;
}

/**
 * Does a round of counting for STV
 * @param  {vote[]} votes    Votes to be counted
 * @param  {number} seats    Number of seats available
 * @param  {number} [quota] Quota needed to declared a candidate elected;
 * defaults to Droop quota calculated from `votes.length` and `seats`
 * @param  {string[]} hopefuls List of candidates to be counted, i.e. neither
 * elected nor eliminated
 * @param  {string[]} eliminated List of candidates eliminated from counting
 * @param  {string[]} elected  List of already elected candidates
 * @param  {Object[]} counts   History of votes received by the candidates in
 * previous rounds
 * @param  {Object} [surplus = {}] Surplus votes to be redistributed from last
 * round; defaults to `{}`
 * @return {string[]}          List of all elected candidates after this round
 */
function round(votes, values, seats, quota = -1, hopefuls, eliminated, elected,
  counts, surplus = {}) {
  if (elected.length === seats) {
    console.log('<all vacancies filled>')
    console.log('********** COUNTING ENDS **********');
    return {
      elected,
      counts,
    }
  }

  if (hopefuls.length <= seats - elected.length) {
    console.log('<remaining candidates can fill all vacancies>')
    hopefuls.forEach(v => {
      elected.push(v);
      console.log(chalk.white.bgGreen('----- elected', v, '-----'));
    });
    console.log('********** COUNTING ENDS **********');
    return {
      elected,
      counts,
    };
  }

  console.log('---------- ROUND', counts.length + 1, '----------');

  if (quota === -1) {
    quota = Math.floor(votes.length / (seats + 1) + 1);
  }
  let distributed = {};
  if (Object.keys(surplus).length > 0) {
    distributed = distributeSurplus(votes, values, counts[counts.length - 1],
      surplus);
    surplus = {};
  }

  let roundCount = {};
  let roundElected = [];
  let hasElected = false;

  for (let v of hopefuls) {
    let count = 0;
    if (counts.length === 0) {
      count = countPref(1, v, votes);
    } else {
      count = distributed[v];
    }
    roundCount[v] = count;
    if (count >= quota) {
      roundElected.push(v);
      elected.push(v);
      hopefuls = hopefuls.filter(h => h !== v);
    }
  }

  counts.push(roundCount);
  console.log('+++++ round count +++++');
  roundCountTable(roundCount);

  let excluded = [...elected, ...eliminated];
  if (roundElected.length === 0) {
    let elimCand = eliminate(votes, values, '', roundCount, hopefuls, excluded,
    surplus, counts);
    eliminated.push(elimCand);
    hopefuls = hopefuls.filter(v => v !== elimCand);
    console.log(chalk.gray.bgYellow('----- eliminated', elimCand, '-----'));
  } else {
    roundElected.forEach(v => {
      console.log(chalk.white.bgGreen('----- elected', v, '-----'));
      eliminate(votes, values, v, roundCount, hopefuls, excluded, surplus,
        counts, roundCount[v] - quota);
    });
  }

  if (counts.length < 20) {} else {return;}
  return round(votes, values, seats, quota, hopefuls, eliminated, elected,
    counts, surplus);
}

function countSurplus(votes, values, candidate, hopefuls, excluded) {
  let surplus = {};
  let transferred = _.cloneDeep(votes).map((val, ind, arr) => {
    if (val[0] === candidate) return val;
    return [];
  });
  let total = transferred.length;

  for (let exclude of excluded) {
    transferred.forEach((val, ind, arr) => {
      transferred[ind] = val.filter(v => v !== exclude);
    });
  }

  for (let hopeful of hopefuls) {
    surplus[hopeful] = getPref(1, hopeful, transferred);
  }

  return {
    dist: surplus
  };
}

function distributeSurplus(votes, values, lastCounts, surplus) {
  let count = Object.assign({}, lastCounts);
  let totalTransferred = {};
  for (let candidate in surplus) {
    if (surplus.hasOwnProperty(candidate)) {
      totalTransferred = 0;
      let tableCount = {};
      let dist = surplus[candidate].dist;
      if(surplus[candidate].surplus < count[candidate]) {
        if(count[candidate] > 0) {
          let value = surplus[candidate].surplus / count[candidate];
          for (let transfer in dist) {
            if (dist.hasOwnProperty(transfer)) {
              for (let nextPref of dist[transfer]) {
                values[nextPref] *= value;
              }
            }
          }
        }
      }

      console.log(chalk.magenta('----- distributing surplus -----'));
      for (let transfer in dist) {
        if (dist.hasOwnProperty(transfer)) {
          tableCount[transfer] = 0;
          for (let nextPref of dist[transfer]) {
            count[transfer] += values[nextPref];

            tableCount[transfer] += values[nextPref];
            totalTransferred += values[nextPref];
          }
          count[transfer] = count[transfer].round(PRECISION);
        }
      }

      console.log(chalk.bold(candidate));
      for (let transfer in tableCount) {
        if (tableCount[transfer])
          console.log('- transfers', chalk.underline(tableCount[transfer]),
            'votes to', chalk.underline(transfer));
      }

      console.log('-', chalk.bold('Transfer in total:'),
        chalk.underline(totalTransferred), chalk.bold('Exhausted:'),
        chalk.underline(surplus[candidate].surplus - totalTransferred));

    }
  }
  return count;
}

function eliminate(votes, values, candidate, roundCount, hopefuls, excluded,
surplus, counts, surplusVotes = null) {

  if (candidate === '') {
    candidate = Object.keys(roundCount);
    let minVotes = _.min(_.values(roundCount));
    let potentials = [];
    candidate.forEach(function(val, ind) {
      if (roundCount[val] === minVotes) {
        potentials.push(ind);
      }
    });
    if (potentials.length <= 0)
      console.error('********** unable to continue elimination **********');
    if (potentials.length === 1) {
      candidate = candidate[potentials[0]];
    } else {
      let potentialCands = [];
      for (let ind of potentials) {
        potentialCands.push(candidate[ind])
      }
      candidate = breakTie(potentialCands, counts);
    }
    excluded.push(candidate);
    hopefuls = hopefuls.filter(v => v !== candidate);
  }

  surplus[candidate] = countSurplus(votes, values, candidate, hopefuls,
    excluded);
  surplus[candidate].surplus = surplusVotes !== null ?
    surplusVotes : roundCount[candidate];

  votes.forEach((val, ind, arr) => {
    votes[ind] = val.filter(v => v !== candidate);
  });

  return candidate;
}

/**
 * Breaks a tie in elimination step by returning the candidate with lowest
 * number of votes in the last round; if fails to break after counting all
 * previous rounds, a random candidate is returned
 * @param  {string[]} potentials List of tied candidates
 * @param  {Object[]} counts     History of votes received by the candidates in
 * previous rounds
 * @return {string}            Candidate to be eliminated after breaking the tie
 */
function breakTie(potentials, counts) {
  console.log('*a tie!*');
  if (counts.length > 0) {
    let lastCount = counts[counts.length - 1];
    let lastCounts = _.pick(lastCount, potentials);
    let minVotes = _.min(_.values(lastCounts));
    let potentialsTie = [];
    potentials.forEach(function(val, ind) {
      if (lastCounts[val] === minVotes) {
        potentialsTie.push(ind);
      }
    });
    if (potentialsTie.length <= 0)
      console.error('********** unable to continue elimination **********');
    if (potentialsTie.length === potentials.length) {
      let against = potentials[Math.floor(Math.random() * potentials.length)];
      console.log('----- tie randomly broken against', against, '-----');
      return against;
    }
    if (potentialsTie.length === 1) {
      let against = potentials[potentialsTie[0]];
      console.log('----- tie broken against', against, '-----');
      return against;
    }
    let potentialCands = [];
    for (let ind in potentialsTie) {
      potentialCands.push(potentials[ind])
    }
    return breakTie(potentialCands, counts.slice(0, -1));
  }
}

function count({votes, candidates, seats, quota}) {
  console.log(chalk.underline('stvCount', VERSION, '(c) Z. Tong Zhang\n'));
  console.log('********** COUNTING STARTS **********')

  if (quota < 0) quota = Math.floor(votes.length / (seats + 1) + 1);
  let values = new Array(votes.length).fill(1);
  let result = round(votes, values, seats, quota, candidates, [], [], []);

  console.log('votes #:', votes.length);
  console.log('quota:', quota);
  countsTable(result.counts, result.elected);

  let elected = new Table({head: [chalk.bold.green('ELECTED')]});
  result.elected.forEach(v => elected.push([v]));
  console.log(elected.toString());

  return result;
}

function roundCountTable(roundCount) {
  let table = new Table();
  for(let candidate in roundCount) {
    table.push({
      [chalk.cyan.bold(candidate)]: roundCount[candidate],
    });
  }
  return console.log(table.toString());
}

function countsTable(counts, elected) {
  const isElected = candidate => elected.includes(candidate) ?
    chalk.bold.green('✓') : chalk.bold.red('✗');
  let table = new Table({
    head: [chalk.blue.bold('Round'), ...Array.from(new Array(counts.length),
      (x, i) => chalk.blue.bold(i + 1)), chalk.bold.green('Elected')],
  });

  for (let candidate in counts[0]) {
    table.push({
      [chalk.cyan.bold(candidate)]: [...Array.from(new Array(counts.length),
        (x, i) => candidate in counts[i] ?
          counts[i][candidate] : isElected(candidate)),
        isElected(candidate)],
    })
  }

  return console.log(table.toString());
}

let options = require('../options.json');
const PRECISION = options.precision || 6;
const Converter = require('csvtojson').Converter;
let converter = new Converter({});

converter.on('end_parsed', jsonArray => {
  let votes = [];
  let ind = 0;
  for (let vote of jsonArray) {
    vote = _.pickBy(vote, _.identity);
    let voteArray = Object.keys(vote).sort((a, b) => vote[a] - vote[b]);
    let temp = [];
    for (let i of voteArray)
      i && temp.push(i);

    voteArray = temp;
    votes[ind++] = voteArray;
  }
  options.votes = votes;
  count(options);
});

require('fs').createReadStream('./votes.csv').pipe(converter);

import _ from 'lodash'

function populate(votes) {
  let populated = [];
  for (let vote of votes) {
    Array(vote[0]).fill(vote[1]).forEach(v => populated.push(v));
  }
  return populated;
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
function round(votes, seats, quota = -1, hopefuls, eliminated, elected, counts,
surplus = {}) {
  if (elected.length === seats) {
    return elected;
  }

  if (quota === -1) {
    quota = Math.floor(votes.length / (seats + 1) + 1);
  }
  let distributed = {};
  if (Object.keys(surplus).length > 0) {
    distributed = distributeSurplus(votes, counts, surplus);
  }

  let roundCounts = {};
  let roundElected = [];
  let hasElected = false;

  for (let v of candidates) {
    let count = 0;
    if (counts.length = 0) {
      count = countPref(1, v, votes);
    } else {
      count = distributed[v];
    }
    roundCounts[v] = count;
    if (count >= quota) {
      roundElected.push(v);
      elected.push(v);
    }
  }

  if (roundElected.length === 0) {
    eliminate(votes, roundCounts, surplus, counts);
  } else {
    roundElected.forEach(v => {

    });
  }

  counts.push(roundCounts);
  return round(votes, seats, quota, hopefuls, excluded, elected, counts,
    surplus);
}

function countSurplus(votes, candidate, excluded) {}
function distributeSurplus(votes, counts, surplus) {}
function eliminate(votes, candidate = '', roundCounts, surplus, counts,
surplusVotes = 0) {
  if (candidate === '') {
    candidates = Object.keys(roundCounts);
    minVotes = _.min(_.values(roundCounts));
    potentials = candidates.reduce(function(prev, curr, ind, arr) {
      if (curr === minVotes) {
        prev.push(ind);
      }
      return prev;
    }, []);
    if (potentials <= 0) console.error('unable to continue elimination');
    if (potentials.length === 1) {
      candidate = candidates[potentials[0]];
    } else {
      candidate = breakTie(potentials, counts);
    }
  }
  for (let vote of votes) {
    vote.filter(e => e !== candidate);
  }
  surplus[candidate].surplus = surplusVotes || roundCounts[candidate];
  surplus[candidate].dist = countSurplus(votes, candidate)
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
  console.error('a tie!');
  if (counts.length > 0) {
    let lastCount = counts[counts.length - 1];
    let lastCounts = _.pick(lastCount, potentials);
    minVotes = _.min(_.values(lastCounts));
    potentialsTie = potentials.reduce(function(prev, curr, ind, arr) {
      if (curr === minVotes) {
        prev.push(ind);
      }
      return prev;
    }, []);
    if (potentialsTie <= 0) console.error('unable to continue elimination');
    if (potentialTie.length === potentials.length) {
      return potentials[Math.floor(Math.random() * potentials.length)];
    }
    if (potentialsTie.length === 1) {
      return potentials[potentialsTie[0]];
    }
    return breakTie(potentialsTie, counts.slice(0, -1));
  }
}

let votes = [];
let candidates = ['a', 'b', 'c', 'd'];
let seats = 3;
const [a, b, c, d] = candidates;

votes = populate([
  [4, [a,b,c,d]],
  [1, [a,c,d,b]],
  [2, [b,a,d,c]],
  [3, [b,a,c,d]],
  [5, [a,d,b,c]],
  [4, [c,b,d,a]],
  [5, [d,c,b,a]],
]);

var quota = Math.floor(votes.length / (seats + 1) + 1); // Droop
var hopefuls = candidates;
var excluded = [];
var elected = [];
var counts = [];

console.log('votes #', votes.length);
console.log('quota', quota);
console.log('counts', counts);
console.log('elected', elected);

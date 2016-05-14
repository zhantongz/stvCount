stvCount
========
This is an counter for single transferable vote (STV) electoral system, written
in Javascript.

It is designed for the use of Reddit Model World
([/r/cmhoc](https://reddit.com/r/cmhoc) and
[/r/MHoC](https://reddit.com/r/mhoc)).

It roughly follows the Scottish system whereas:

1. Droop quota is used; every candidate who reaches the quota is elected. Other
quota may be configured.
2. The surplus vote is not transferred to elected candidates but rather to the
next preferred candidate on the ballot (who is neither elected nor eliminated).
3. For each elected candidate that exceeds the quota, every vote for that
candidate, including votes transferred to the candidate, is transferred to the
next preferred candidate (who is neither elected nor eliminated) at a value
equal to the ratio of the surplus votes to the total number of votes.
4. A tie is broken in favour of the candidate with the highest number of votes
in the last earlier round without tie. If the tie cannot be broken because all
preceding rounds are tied, the tie is broken randomly.

The default setting is the Model Canadian system and is verified against past
IRV election results in Model Canada (/r/cmhoc).

STV counting is verified against openSTV 1.7. Past Model Canadian elections were
not conducted exactly following the system.

See `result` for sample result (IRV).

Usage
-------
[Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) are required.

```
npm install
./stvCount [[--options|-o] <options_file>] [--csv|--json] <file_name>
```

### Command line flags
* **--csv** <*file_name*>: count votes from reading a CSV ballot file
* **--json** <*file_name*>: count votes from reading a JSON ballot file
* **--option** <*options_file*>: specify an options file. Default:
`options.json` (under working directory)

### Options file (`options.json`)
``` json
{
  "seats": 2,
  "candidates": ["candidate1", "candidate2", "candidate3"],
  "quota": -1,
  "precision": 6,
  "log": true,
  "ron": ""
}
```
* **seats**: number of seats available. The counting ends when all seats are
filled.
- **candidates**: list of candidates. Default: generated from votes; candidates
who are not ranked by any one at all will not be reported.
- **quota**: quota used to declare someone elected. When set below 0, the Droop
quota is used; otherwise the quota is fixed at the given non-negative value.
Default: `-1` (use Droop quota)
- **precision**: the precision for fractional vote transfer. Default: `6`
- **log**: only credit, counting start and counting end are logged if `false`.
Default: `true`
- **ron**: the name of the Re-open Nomination (RON) candidate. The RON candidate
is never eliminated. If RON is not a supported option, it should be set to
an empty string. Default: `''`

### CSV ballot file (`votes.csv`)
CSV ballot file is suitable for  votes collected through table-format ranking,
e.g. Google Forms.

The first row lists all candidates ranked, followed by ballots. A ballot is
comprised of rankings for the coressponding candidates in the first row.

For example,
``` csv
candidate1, candidate2, candidate3
1,2,3
2,3,1
1,3,2
1,2,3
```

Here, three voters (1st, 3rd and 4th ballot) ranked `candidate1` as their first
preference. `candidate2` is ranked the first on the second ballot.

### JSON ballot file
In a JSON ballot file, the votes are represented by an array of ordered arrays
of the candidates.

For example, the following JSON is equivalent to the CSV file above:
``` json
[
  ["candidate1", "candidate2", "candidate3"],
  ["candidate3", "candidate1", "candidate2"],
  ["candidate1", "candidate3", "candidate2"],
  ["candidate1", "candidate2", "candidate3"]  
]
```


### `result`
The counting can be logged into `result` file (or any other file) by using
redirect `>` or `>>` in `bash` or other shell.


Copyright & Licence
-------
Copyright (c) 2016 Z. Tong Zhang

Licensed under MIT, see `LICENSE`.

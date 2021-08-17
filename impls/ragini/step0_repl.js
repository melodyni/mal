const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const READ = (str) => str;
const EVAL = (str) => str;
const PRINT = (str) => str;
const rep = (str) => PRINT(EVAL(READ(str)));

const main = () => {
  rl.question('user> ', (str) => {
    console.log(rep(str));
    main();
  });
};

main();

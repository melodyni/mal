const readline = require('readline');
const { read_str } = require('./reader');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const READ = (str) => read_str(str);
const EVAL = (str) => str;
const PRINT = (str) => str.toString();
const rep = (str) => PRINT(EVAL(READ(str)));

const main = () => {
  rl.question('user> ', (str) => {
    try {
      console.log(rep(str));
    } catch (e) {
      console.log(e);
    } finally {
      main();
    }
  });
};

main();

const readline = require('readline');
const { read_str } = require('./reader');
const { pr_str } = require('./printer');
const { MalValue, MalSymbol, List , Vector, Hashmap} = require('./types');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

repl_env = {'+': (a,b)=> a+b,
            '-': (a,b)=> a-b,
            '*': (a,b)=> a*b,
            '/': (a,b)=> a/b,
            "PI": 3.14
          }

const eval_ast = (ast, env) => {
  if(ast instanceof MalSymbol){
    const val = env[ast.symbol]
    if(val) { 
      return val
    }
    throw `${ast.symbol} not found`
  }
  if(ast instanceof List){
    return new List(ast.ast.map(x=> EVAL(x, env)))
  }
  if(ast instanceof Vector){
    return new Vector(ast.ast.map(x=> EVAL(x, env)))
  }
  return ast
};

const EVAL = (ast, repl_env) => {
  if(!(ast instanceof List)){
    return eval_ast(ast, repl_env)
  }
  if(ast.isEmpty()){
    return ast
  }
  [fn, ...args] = eval_ast(ast, repl_env).ast;
  if(fn instanceof Function){
    return fn.apply(null, args)
  }
}

const READ = (str) => read_str(str);
const PRINT = (val) => pr_str(val, true);
const rep = (str) => PRINT(EVAL(READ(str), repl_env));

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
  
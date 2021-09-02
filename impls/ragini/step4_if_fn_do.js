const readline = require('readline');
const { read_str } = require('./reader');
const { pr_str } = require('./printer');
const { MalSymbol, List, Vector, Hashmap, Nil } = require('./types');
const Env = require('./env');

const { core } = require('./core');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const eval_ast = (ast, core) => {
  if (ast instanceof MalSymbol) {
    return core.get(ast);
  }
  if (ast instanceof List) {
    return new List(ast.ast.map((x) => EVAL(x, core)));
  }
  if (ast instanceof Vector) {
    return new Vector(ast.ast.map((x) => EVAL(x, core)));
  }
  if (ast instanceof Hashmap) {
    const evaluatedMap = new Map();
    for ([key, val] of ast.hashmap.entries()) {
      evaluatedMap.set(key, EVAL(val, core));
    }
    return new Hashmap(evaluatedMap);
  }
  return ast;
};

const EVAL = (ast, core) => {
  if (!(ast instanceof List)) {
    return eval_ast(ast, core);
  }
  if (ast.isEmpty()) {
    return ast;
  }

  const firstElement = ast.ast[0].symbol;

  if (firstElement === 'def!') {
    if (ast.ast.length != 3) {
      throw 'Incorrect number of argument to def!';
    }
    return core.set(ast.ast[1], EVAL(ast.ast[2], core));
  }

  if (firstElement === 'let*') {
    if (ast.ast.length != 3) {
      throw 'Incorrect number of argument to let*';
    }
    const newEnv = new Env(core);
    const bindings = ast.ast[1].ast;
    for (let i = 0; i < bindings.length; i += 2) {
      newEnv.set(bindings[i], EVAL(bindings[i + 1], newEnv));
    }
    return EVAL(ast.ast[2], newEnv);
  }

  if (firstElement === 'do') {
    return ast.ast.slice(1).reduce((_, form) => EVAL(form, core), Nil);
  }

  if (firstElement === 'if') {
    const expr = EVAL(ast.ast[1], core);
    if (expr === false || expr === Nil) {
      return EVAL(ast.ast[3], core);
    }
    return EVAL(ast.ast[2], core);
  }

  if (firstElement === 'fn*') {
    return function (...exprs) {
      const newEnv = Env.createEnv(core, ast.ast[1].ast, exprs);
      return EVAL(ast.ast[2], newEnv);
    };
  }

  [fn, ...args] = eval_ast(ast, core).ast;
  if (fn instanceof Function) {
    return fn.apply(null, args);
  }
  throw `${fn} is not a function`;
};

const READ = (str) => read_str(str);
const PRINT = (val) => pr_str(val, true);
const rep = (str) => PRINT(EVAL(READ(str), core));

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

const readline = require('readline');
const { read_str } = require('./reader');
const { pr_str } = require('./printer');
const { MalSymbol, List, Vector, Hashmap, Nil } = require('./types');
const Env = require('./env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const env = new Env();

env.set(new MalSymbol('+'), (...args) => args.reduce((a, b) => a + b, 0));

env.set(new MalSymbol('*'), (...args) => args.reduce((a, b) => a * b, 1));

env.set(new MalSymbol('-'), (...args) => {
  if (args.length === 1) {
    args.unshift(0);
  }
  return args.reduce((a, b) => a - b);
});

env.set(new MalSymbol('/'), (...args) => {
  if (args.length === 1) {
    args.unshift(1);
  }
  return args.reduce((a, b) => a / b);
});

env.set(new MalSymbol('='), (a, b) => a == b);
env.set(new MalSymbol('PI'), 3.14);

const eval_ast = (ast, env) => {
  if (ast instanceof MalSymbol) {
    return env.get(ast);
  }
  if (ast instanceof List) {
    return new List(ast.ast.map((x) => EVAL(x, env)));
  }
  if (ast instanceof Vector) {
    return new Vector(ast.ast.map((x) => EVAL(x, env)));
  }
  if (ast instanceof Hashmap) {
    const evaluatedMap = new Map();
    for ([key, val] of ast.hashmap.entries()) {
      evaluatedMap.set(key, EVAL(val, env));
    }
    return new Hashmap(evaluatedMap);
  }
  return ast;
};

const EVAL = (ast, env) => {
  if (!(ast instanceof List)) {
    return eval_ast(ast, env);
  }
  if (ast.isEmpty()) {
    return ast;
  }

  const firstElement = ast.ast[0].symbol;

  if (firstElement === 'def!') {
    if (ast.ast.length != 3) {
      throw 'Incorrect number of argument to def!';
    }
    return env.set(ast.ast[1], EVAL(ast.ast[2], env));
  }

  if (firstElement === 'let*') {
    if (ast.ast.length != 3) {
      throw 'Incorrect number of argument to let*';
    }
    const newEnv = new Env(env);
    const bindings = ast.ast[1].ast;
    for (let i = 0; i < bindings.length; i += 2) {
      newEnv.set(bindings[i], EVAL(bindings[i + 1], newEnv));
    }
    return EVAL(ast.ast[2], newEnv);
  }

  if (firstElement === 'do') {
    return ast.ast.slice(1).reduce((_, form) => EVAL(form, env), Nil);
  }

  if (firstElement === 'if') {
    const expr = EVAL(ast.ast[1], env);
    if (expr === false || expr === Nil) {
      return EVAL(ast.ast[3], env);
    }
    return EVAL(ast.ast[2], env);
  }

  if (firstElement === 'fn*') {
    return function (...exprs) {
      const newEnv = Env.createEnv(env, ast.ast[1].ast, exprs);
      return EVAL(ast.ast[2], newEnv);
    };
  }

  [fn, ...args] = eval_ast(ast, env).ast;
  if (fn instanceof Function) {
    return fn.apply(null, args);
  }
  throw `${fn} is not a function`;
};

const READ = (str) => read_str(str);
const PRINT = (val) => pr_str(val, true);
const rep = (str) => PRINT(EVAL(READ(str), env));

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

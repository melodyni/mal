const readline = require('readline');
const { read_str } = require('./reader');
const { pr_str } = require('./printer');
const { MalSymbol, List, Vector, Hashmap, Nil, Fn } = require('./types');
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
  while (true) {
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
      env = newEnv;
      ast = ast.ast[2];
    }

    if (firstElement === 'do') {
      ast.ast.slice(1, -1).forEach((form) => EVAL(form, env));
      ast = ast.ast[ast.ast.length - 1];
      continue;
    }

    if (firstElement === 'if') {
      const expr = EVAL(ast.ast[1], env);
      if (expr === false || expr === Nil) {
        ast = ast.ast[3];
        // return EVAL(ast.ast[3], env);
      } else {
        ast = ast.ast[2];
      }
      continue;
    }

    if (firstElement === 'fn*') {
      return new Fn(ast.ast[1].ast, ast.ast[2], env);
    }

    [fn, ...args] = eval_ast(ast, env).ast;

    if (fn instanceof Fn) {
      ast = fn.fnBody;
      env = Env.createEnv(fn.env, fn.binds, args);
      continue;
    }

    if (fn instanceof Function) {
      return fn.apply(null, args);
    }
    throw `${fn} is not a function`;
  }
};

const READ = (str) => read_str(str);
const PRINT = (val) => pr_str(val, true);
const rep = (str) => PRINT(EVAL(READ(str), env));

rep('(def! not (fn* [x] (if x false true)))');
rep('(def! sqr (fn* [x] (* x x)))');

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

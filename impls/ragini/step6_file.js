const fs = require('fs');
const { stdin, stdout, argv } = require('process');
const readline = require('readline');
const { read_str } = require('./reader');
const { pr_str } = require('./printer');
const {
  MalSymbol,
  List,
  Vector,
  Hashmap,
  Nil,
  Fn,
  Atom,
  Str,
} = require('./types');

const Env = require('./env');

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
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
env.set(new MalSymbol('<='), (a, b) => a <= b);
env.set(new MalSymbol('inc'), (a) => a + 1);
env.set(new MalSymbol('PI'), 3.14);

env.set(
  new MalSymbol('str'),
  (...args) => new Str(args.reduce((str, arg) => str + pr_str(arg, false), ''))
);
env.set(new MalSymbol('list'), (...args) => new List(args));
env.set(new MalSymbol('list?'), (arg) => arg instanceof List);

env.set(new MalSymbol('prn'), (...args) => {
  console.log(args.reduce((str, arg) => str + pr_str(arg, true), ''));
  return Nil;
});
env.set(new MalSymbol('read_str'), (arg) => read_str(arg));

env.set(new MalSymbol('read-string'), (arg) => {
  const ast = read_str(arg.string);
  return ast;
});
env.set(new MalSymbol('slurp'), (filename) => {
  const content = fs.readFileSync(filename.string, 'utf-8');
  return new Str(content);
});

env.set(new MalSymbol('atom'), (malValue) => new Atom(malValue));
env.set(new MalSymbol('atom?'), (arg) => arg instanceof Atom);
env.set(new MalSymbol('deref'), (atom) => atom.value);
env.set(new MalSymbol('reset!'), (atom, malValue) => atom.update(malValue));
env.set(new MalSymbol('swap!'), (atom, fn, ...args) => {
  return EVAL(
    new List([
      new MalSymbol('reset!'),
      atom,
      new List([fn, atom.value, ...args]),
    ]),
    env
  );
});
env.set(
  new MalSymbol('*ARGV*'),
  new List(argv.slice(3).map((arg) => new Str(arg)))
);

env.set(new MalSymbol('eval'), (ast) => {
  return EVAL(ast, env);
});

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
      continue;
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
rep(
  '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))'
);

const main = () => {
  if (argv.length > 2) {
    const program = argv[2];
    rep(`(load-file "${program}")`);
    process.exit(0);
  }
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

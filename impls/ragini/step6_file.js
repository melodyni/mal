const { stdin, stdout, argv } = require('process');
const readline = require('readline');
const { read_str } = require('./reader');
const { pr_str } = require('./printer');
const { MalSymbol, List, Vector, Hashmap, Nil, Fn, Str } = require('./types');

const Env = require('./env');
const { core } = require('./core');

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

core.set(new MalSymbol('swap!'), (atom, fn, ...args) => {
  return EVAL(
    new List([
      new MalSymbol('reset!'),
      atom,
      new List([fn, atom.value, ...args]),
    ]),
    core
  );
});
core.set(
  new MalSymbol('*ARGV*'),
  new List(argv.slice(3).map((arg) => new Str(arg)))
);

core.set(new MalSymbol('eval'), (ast) => {
  return EVAL(ast, core);
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
  while (true) {
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
      core = newEnv;
      ast = ast.ast[2];
      continue;
    }

    if (firstElement === 'do') {
      ast.ast.slice(1, -1).forEach((form) => EVAL(form, core));
      ast = ast.ast[ast.ast.length - 1];
      continue;
    }

    if (firstElement === 'if') {
      const expr = EVAL(ast.ast[1], core);
      if (expr === false || expr === Nil) {
        ast = ast.ast[3];
      } else {
        ast = ast.ast[2];
      }
      continue;
    }

    if (firstElement === 'fn*') {
      return new Fn(ast.ast[1].ast, ast.ast[2], core);
    }

    [fn, ...args] = eval_ast(ast, core).ast;
    if (fn instanceof Fn) {
      ast = fn.fnBody;
      core = Env.createEnv(fn.env, fn.binds, args);
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
const rep = (str) => PRINT(EVAL(READ(str), core));

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

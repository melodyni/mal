const { stdin, stdout, argv } = require('process');
const readline = require('readline');
const { read_str, prependSymbol } = require('./reader');
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
    ast = macroExpand(ast, core);
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

    if (firstElement === 'defmacro!') {
      if (ast.ast.length != 3) {
        throw 'Incorrect number of argument to defmacro!';
      }
      const val = EVAL(ast.ast[2], core);
      val.isMacro = true;
      return core.set(ast.ast[1], val);
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
        if (ast.ast[3] === undefined) {
          return Nil;
        }
        return EVAL(ast.ast[3], core);
      }
      return EVAL(ast.ast[2], core);
    }

    if (firstElement === 'fn*') {
      const fn = (...args) => {
        const newEnv = Env.createEnv(core, ast.ast[1].ast, args);
        return EVAL(ast.ast[2], newEnv);
      };
      return new Fn(ast.ast[1].ast, ast.ast[2], core, fn);
    }

    if (firstElement === 'quote') {
      return ast.ast[1];
    }

    if (firstElement === 'quasiquoteexpand') {
      return quasiquote(ast.ast[1]);
    }

    if (firstElement === 'quasiquote') {
      ast = quasiquote(ast.ast[1]);
      continue;
    }

    if (firstElement === 'macroexpand') {
      return macroExpand(ast.ast[1], core);
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

const quasiquote = (ast) => {
  if (ast instanceof List) {
    if (ast.beginsWith('unquote')) {
      return ast.ast[1];
    }
    let result = new List([]);
    for (let i = ast.ast.length - 1; i >= 0; i--) {
      const elt = ast.ast[i];
      if (elt instanceof List && elt.beginsWith('splice-unquote')) {
        result = new List([new MalSymbol('concat'), elt.ast[1], result]);
      } else {
        result = new List([new MalSymbol('cons'), quasiquote(elt), result]);
      }
    }
    return result;
  }
  if (ast instanceof Vector) {
    let result = new List([]);
    for (let i = ast.ast.length - 1; i >= 0; i--) {
      const elt = ast.ast[i];
      if (elt instanceof List && elt.beginsWith('splice-unquote')) {
        result = new List([new MalSymbol('concat'), elt.ast[1], result]);
      } else {
        result = new List([new MalSymbol('cons'), quasiquote(elt), result]);
      }
    }
    return new List([new MalSymbol('vec'), result]);
  }
  if (ast instanceof MalSymbol || ast instanceof Hashmap) {
    return new List([new MalSymbol('quote'), ast]);
  }
  return ast;
};

const is_macro_call = (ast, core) => {
  if (!(ast instanceof List)) {
    return false;
  }
  const elt = ast.ast[0];
  return (
    elt instanceof MalSymbol &&
    core.find(elt) &&
    core.get(elt) instanceof Fn &&
    core.get(elt).isMacro
  );
};

const macroExpand = (ast, core) => {
  while (is_macro_call(ast, core)) {
    const macro = core.get(ast.ast[0]);
    ast = macro.apply(ast.ast.slice(1));
  }
  return ast;
};

const READ = (str) => read_str(str);
const PRINT = (val) => pr_str(val, true);
const rep = (str) => PRINT(EVAL(READ(str), core));

rep('(def! not (fn* [x] (if x false true)))');
rep('(def! sqr (fn* [x] (* x x)))');
rep(
  '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))'
);
rep(
  '(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list \'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw "odd number of forms to cond")) (cons \'cond (rest (rest xs)))))))'
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

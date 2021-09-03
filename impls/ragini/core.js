const fs = require('fs');
const { MalSymbol, Str, List, Nil, Atom, Vector } = require('./types');
const { read_str } = require('./reader');
const { pr_str } = require('./printer');
const Env = require('./env');

const core = new Env();

core.set(new MalSymbol('+'), (...args) => args.reduce((a, b) => a + b, 0));

core.set(new MalSymbol('*'), (...args) => args.reduce((a, b) => a * b, 1));

core.set(new MalSymbol('-'), (...args) => {
  if (args.length === 1) {
    args.unshift(0);
  }
  return args.reduce((a, b) => a - b);
});

core.set(new MalSymbol('/'), (...args) => {
  if (args.length === 1) {
    args.unshift(1);
  }
  return args.reduce((a, b) => a / b);
});

core.set(new MalSymbol('='), (a, b) => a == b);

core.set(new MalSymbol('PI'), 3.14);

core.set(new MalSymbol('<='), (a, b) => a <= b);

core.set(new MalSymbol('inc'), (a) => a + 1);

core.set(new MalSymbol('PI'), 3.14);

core.set(
  new MalSymbol('str'),
  (...args) => new Str(args.reduce((str, arg) => str + pr_str(arg, false), ''))
);

core.set(new MalSymbol('list'), (...args) => new List(args));

core.set(new MalSymbol('list?'), (arg) => arg instanceof List);

core.set(new MalSymbol('prn'), (...args) => {
  console.log(args.reduce((str, arg) => str + pr_str(arg, true), ''));
  return Nil;
});

core.set(new MalSymbol('read_str'), (arg) => read_str(arg));

core.set(new MalSymbol('read-string'), (arg) => {
  const ast = read_str(arg.string);
  return ast;
});

core.set(new MalSymbol('slurp'), (filename) => {
  const content = fs.readFileSync(filename.string, 'utf-8');
  return new Str(content);
});

core.set(new MalSymbol('atom'), (malValue) => new Atom(malValue));
core.set(new MalSymbol('atom?'), (arg) => arg instanceof Atom);
core.set(new MalSymbol('deref'), (atom) => atom.deref());
core.set(new MalSymbol('reset!'), (atom, malValue) => atom.reset(malValue));

core.set(new MalSymbol('cons'), (elem, seq) => seq.cons(elem));
core.set(new MalSymbol('concat'), (...lists) => {
  const list = new List([]);
  return lists.reduce((a, b) => a.concat(b), list);
});

core.set(new MalSymbol('vec'), (seq) => {
  return new Vector([...seq.ast]);
});

module.exports = { core };

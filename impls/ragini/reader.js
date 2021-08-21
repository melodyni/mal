const { List, Vector, Str, Keyword, MalSymbol, Hashmap, Nil } = require('./types');

class Reader {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  peek() {
    return this.tokens[this.position];
  }

  next() {
    const token = this.peek();
    if (this.position < this.tokens.length) {
      this.position++;
    }
    return token;
  }
}

const tokenize = (str) => {
  re = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;

  return [...str.matchAll(re)].map((x) => x[1]).slice(0, -1);
};

const read_atom = (reader) => {
  const token = reader.next();
  if (token.match(/^-?[0-9]+$/)) {
    return parseInt(token);
  }

  if (token.match(/^-?[0-9][0-9.]*$/)) {
    return parseFloat(token);
  }

  if (token.match(/^"(?:\\.|[^\\"])*"$/)) {
    let str = token.slice(1, token.length - 1).replace(/\\(.)/g, function (_, c) { return c === 'n' ? '\n' : c });
    return new Str(str);
  }

  if (token.startsWith('"')) {
    throw 'unbalanced "';
  }

  if (token === 'true') {
    return true;
  }

  if (token === 'false') {
    return false;
  }

  if (token === 'nil') {
    return Nil;
  }

  if (token.startsWith(':')) {
    return new Keyword(token.slice(1));
  }

  return new MalSymbol(token);
};

const read_seq = function (reader, closeSymbol) {
  const ast = [];
  reader.next();
  while (reader.peek() != closeSymbol) {
    if (reader.peek() === undefined) {
      throw 'unbalanced';
    }
    ast.push(read_form(reader));
  }
  reader.next();
  return ast;
};

const read_list = function (reader) {
  const ast = read_seq(reader, ')');
  return new List(ast);
};

const read_vector = function (reader) {
  const ast = read_seq(reader, ']');
  return new Vector(ast);
};

const read_hashmap = (reader) => {
  const ast = read_seq(reader, '}');
  if (ast.length % 2 != 0) {
    throw 'odd number of hashmap arguments';
  }
  const hashmap = new Map();
  for (let i = 0; i < ast.length; i += 2) {
    if (!(ast[i] instanceof Str || ast[i] instanceof Keyword)) {
      throw 'hashmap key is not string';
    }
    hashmap.set(ast[i], ast[i + 1]);
  }
  return new Hashmap(hashmap);
};

const read_form = (reader) => {
  const token = reader.peek();

  switch (token[0]) {
    case '(':
      return read_list(reader);
    case '[':
      return read_vector(reader);
    case '{':
      return read_hashmap(reader);
    case ')':
      throw 'unbalanced )';
    case ']':
      throw 'unbalanced ]';
    case '}':
      throw 'unbalanced }';
  }
  return read_atom(reader);
};

const read_str = (str) => {
  const tokens = tokenize(str);
  const reader = new Reader(tokens);
  return read_form(reader);
};

module.exports = { read_str };

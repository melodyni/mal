const { List, Vector, Str, Keyword, MalSymbol } = require('./types');

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
    return new Str(token.slice(1, -1));
  }

  if (token === true) {
    return true;
  }

  if (token === false) {
    return false;
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

const read_form = (reader) => {
  const token = reader.peek();

  switch (token[0]) {
    case '(':
      return read_list(reader);
    case '[':
      return read_vector(reader);
    case ')':
      throw 'unbalanced )';
    case ']':
      throw 'unbalanced ]';
  }
  return read_atom(reader);
};

const read_str = (str) => {
  const tokens = tokenize(str);
  const reader = new Reader(tokens);
  return read_form(reader);
};

module.exports = { read_str };

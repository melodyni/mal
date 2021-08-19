const { List } = require('./types');

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
};

const read_list = function (reader) {
  const ast = [];
  reader.next();
  while (reader.peek() != ')') {
    ast.push(read_form(reader));
  }
  reader.next();
  return new List(ast);
};

const read_form = (reader) => {
  const token = reader.peek();

  if (token[0] == '(') {
    return read_list(reader);
  }
  return read_atom(reader);
};

const read_str = (str) => {
  const tokens = tokenize(str);
  const reader = new Reader(tokens);
  return read_form(reader);
};

module.exports = { read_str };

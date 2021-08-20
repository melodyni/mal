class MalValue {
  pr_str() {
    return '*default mal val*';
  }
}

const pr_str = (val) => {
  if (val instanceof MalValue) {
    return val.pr_str();
  }
  return val.toString();
};

class List extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast;
  }

  pr_str() {
    return '(' + this.ast.map((x) => pr_str(x)).join(' ') + ')';
  }
}

class Vector extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast;
  }

  pr_str() {
    return '[' + this.ast.map((x) => pr_str(x)).join(' ') + ']';
  }
}

class NilValue extends MalValue {
  constructor() {
    super();
  }

  pr_str() {
    return 'nil';
  }
}

const Nil = new NilValue();

class Str extends MalValue {
  constructor(string) {
    super();
    this.string = string;
  }

  pr_str() {
    return '"' + this.string + '"';
  }
}

class Keyword extends MalValue {
  constructor(keyword) {
    super();
    this.keyword = keyword;
  }

  pr_str() {
    return ':' + this.keyword;
  }
}

class MalSymbol extends MalValue {
  constructor(symbol) {
    super();
    this.symbol = symbol;
  }

  pr_str() {
    return this.symbol;
  }
}

module.exports = {
  MalValue,
  List,
  Vector,
  Nil,
  Str,
  Keyword,
  MalSymbol,
  pr_str,
};

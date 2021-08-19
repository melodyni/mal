class MalValue {}

class List extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast;
  }

  toString() {
    return '(' + this.ast.map((x) => x.toString()).join(' ') + ')';
  }
}

class Vector extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast;
  }

  toString() {
    return '[' + this.ast.map((x) => x.toString()).join(' ') + ']';
  }
}

module.exports = { MalValue, List, Vector };

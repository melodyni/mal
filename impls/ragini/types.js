class MalValue {
  pr_str(print_readably = false) {
    return '*default mal val*';
  }
}

const pr_str = (val, print_readably = false) => {
  if (val instanceof MalValue) {
    return val.pr_str(print_readably);
  }
  return val.toString();
};

class List extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast;
  }

  isEmpty() {
    return this.ast.length == 0;
  }

  pr_str(print_readably = false) {
    return '(' + this.ast.map((x) => pr_str(x, print_readably)).join(' ') + ')';
  }
}

class Vector extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast;
  }

  pr_str(print_readably = false) {
    return '[' + this.ast.map((x) => pr_str(x, print_readably)).join(' ') + ']';
  }
}

class NilValue extends MalValue {
  constructor() {
    super();
  }

  pr_str(print_readably = false) {
    return 'nil';
  }
}

const Nil = new NilValue();

class Str extends MalValue {
  constructor(string) {
    super();
    this.string = string;
  }

  pr_str(print_readably = false) {
    if (print_readably) {
      return (
        '"' +
        this.string
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n') +
        '"'
      );
    }
    return this.string.toString();
  }
}

class Keyword extends MalValue {
  constructor(keyword) {
    super();
    this.keyword = keyword;
  }

  pr_str(print_readably = false) {
    return ':' + this.keyword;
  }
}

class MalSymbol extends MalValue {
  constructor(symbol) {
    super();
    this.symbol = symbol;
  }

  pr_str(print_readably = false) {
    return this.symbol;
  }
}

class Hashmap extends MalValue {
  constructor(hashmap) {
    super();
    this.hashmap = hashmap;
  }

  pr_str(print_readably = false) {
    let str = '';
    let separator = '';
    for (const [key, val] of this.hashmap.entries()) {
      str =
        str +
        separator +
        pr_str(key, print_readably) +
        ' ' +
        pr_str(val, print_readably);
      separator = ' ';
    }
    return '{' + str + '}';
  }
}

class Fn extends MalValue {
  constructor(binds, fnBody, env) {
    super();
    this.binds = binds;
    this.fnBody = fnBody;
    this.env = env;
  }
  pr_str(print_readably = false) {
    return '#<function>';
  }
}

class Atom extends MalValue {
  constructor(value){
    super();
    this.value = value;
  }
  pr_str(print_readably = false) {
    return '(atom ' + pr_str(this.value, print_readably) + ")";
  }
  update(newValue){
    this.value = newValue;
    return this.value;
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
  Hashmap,
  Fn,
  Atom,
  pr_str,
};

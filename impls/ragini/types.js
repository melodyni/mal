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

class Sequence extends MalValue {
  constructor(ast) {
    super();
    this.ast = ast;
  }
  isEmpty() {
    return this.ast.length === 0;
  }

  count() {
    return this.ast.length;
  }

  cons(element) {
    return new List([element, ...this.ast]);
  }

  concat(other) {
    return new List([...this.ast.concat(other.ast)]);
  }

  beginsWith(symbol) {
    if (!this.isEmpty()) {
      return this.ast[0].symbol === symbol;
    }
    return false;
  }
  equals(other) {
    if (!(other instanceof Sequence) || this.count() !== other.count()) {
      return false;
    }
    return this.ast.every((elt, index) => {
      if (elt instanceof MalValue) {
        return elt.equals(other.ast[index]);
      }
      return other.ast[index] === elt;
    });
  }
}

class List extends Sequence {
  constructor(ast) {
    super();
    this.ast = ast;
  }

  pr_str(print_readably = false) {
    return '(' + this.ast.map((x) => pr_str(x, print_readably)).join(' ') + ')';
  }
}

class Vector extends Sequence {
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

  equals(other) {
    return other instanceof NilValue;
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
  equals(other) {
    if (other instanceof Str) {
      return other.string === this.string;
    }
    return false;
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
  equals(other) {
    if (other instanceof Keyword) {
      return other.keyword === this.keyword;
    }
    return false;
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
  equals(other) {
    if (other instanceof MalSymbol) {
      return other.symbol === this.symbol;
    }
    return false;
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
  constructor(value) {
    super();
    this.value = value;
  }
  deref() {
    return this.value;
  }
  reset(newValue) {
    this.value = newValue;
    return this.value;
  }
  pr_str(print_readably = false) {
    return '(atom ' + pr_str(this.value, print_readably) + ')';
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

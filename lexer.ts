export enum TokenType {
    Keyword,
    Identifier,
    Integer,
    Real,
    Double,
    Complex,
    Logical,
    LogicalOp,
    NumericOp,
    LeftParen,
    RightParen,
    Comma,
    Equals,
};
  
type Token = {
  tokenType: TokenType,
  value: string | null
}

const Keywords = [
  "IF",
  "GOTO",
  "DO",
  "INTEGER",
  "REAL",
  "DOUBLE",
  "COMPLEX",
  "LOGICAL",
  "DIMENSION",
  "FUNCTION",
  "SUBROUTINE",
  "PROGRAM",
  "END",
  "RETURN",
]

const LogicalOperators = [

]

const readInteger = (s: string) => {
  let result = RegExp(/^\d+$/).exec(s);
  return { match: result !== null, token: { tokenType: TokenType.Integer, value: result ? result[0] : null } };
}

const readReal = (s: string) => {
  let exps = [ 
    RegExp(/^([\-+]?\d+\.\d*)($|E[\-+]?\d+)/),
    RegExp(/^([\-+]?\d*\.\d+)($|E[\-+]?\d+)/),
  ];
  let result = exps.map( (r) => r.exec(s) ).reduce( (a, e) => a ? a : e , null );
  return { match: result !== null, 
    token: { tokenType: TokenType.Real, value: result ? result[0] : null } };
}

const readDouble = (s: string) => {
  let exps = [ 
    RegExp(/^([\-+]?\d+\.\d*)($|D[\-+]?\d+)/),
    RegExp(/^([\-+]?\d*\.\d+)($|D[\-+]?\d+)/),
  ];
  let result = exps.map( (r) => r.exec(s) ).reduce( (a, e) => a ? a : e , null );
  return { match: result !== null, 
    token: { tokenType: TokenType.Real, value: result ? result[0] : null } };
}

const readComplex = (s: string) => {
  let complexComps = RegExp(/^\((.+),(.+)\)$/).exec(s);
  if ( !complexComps )
    return false;
  return { match: readReal(complexComps[1]).match && readReal(complexComps[2]).match,
            token: { tokenType: TokenType.Complex, value: complexComps } };
}

const readLogical = (s: string) => { 
  let result = RegExp(/^(\.TRUE\.|\.FALSE\.)$/).exec(s);
  return { match: result !== null, token: { tokenType: TokenType.Logical, value: result ? result[0] : null } };
}

const readLogicalOp = (s: string) => {
  let result = RegExp(/^(\.(EQ|NE|GT|GE|LT|LE|AND|OR|XOR|NOT)\.)$/).exec(s);
  return { match: result !== null, token: { tokenType: TokenType.LogicalOp, value: result ? result[0] : null } };
}

const readNumericOp = (s: string) => {
  let result = RegExp(/^[*+\-\/]$/).exec(s);
  return { match: result !== null, token: { tokenType: TokenType.NumericOp, value: result ? result[0] : null } };
}

const readKeywordOrIdentifer = (s: string) => {
  let result = RegExp(/^([A-Z][A-Z0-9]*)$/).exec(s.replace(" ", ""));
  if ( result == null ) {
    return null;
  }
  if ( Keywords.includes(result[0]) ) {
    return { match: result !== null, token: { tokenType: TokenType.Keyword, value: result[0] } };
  } 
  return { match: result !== null, token: { tokenType: TokenType.Identifier, value: result[0] } };
}

const splitLine = (line: string) => {
  let ids = "[A-Z][A-Z0-9]*";
  let integer = "[0-9]+(?!\.)";
  let realDouble = "(?:(?:[\\-+]?\\d+\\.\\d*(?:[ED][\\-+]?\\d+)?)|(?:[\\-+]?\\d*\\.\\d+(?:[ED][\\-+]?\\d+)?))";
  let complex = `\(${realDouble},${realDouble}\)`;
  let logical = "_(?:TRUE|FALSE)_";
  let numOps = "[*+\-\/]";
  let logicOps = "_(?:EQ|NE|GT|GE|LT|LE|NOT|AND|OR|XOR)_";
  let separators = "[\(\),=]"
  //let stmtSep = /(?:([0-9]+(?!\d*\.)|[A-Z][A-Z0-9]*|(?:(?:[-+]?\d+.\d*(?:[ED][-+]?\d+)?)|(?:[-+]?\d*.\d+(?:[ED][-+]?\d+)?))|\.(?:TRUE|FALSE)\.)([*+\-/]|\.(?:EQ|NE|GT|GE|LT|LE|NOT|AND|OR|XOR)\.|[\(\),=]|$|\s+)([\(\)=,])?)/gd;
  let stmtSep = /([0-9]+(?!\d*\.)|[A-Z][A-Z0-9]*|(?:(?:(?:(?<=[\-\+])[-+])?\d+\.\d*(?:[ED][-+]?\d+)?)|(?:(?:(?<=[\-\+])[-+])?\d*\.\d+(?:[ED][-+]?\d+)?))|\.(?:TRUE|FALSE)\.|\.(?:EQ|NE|GT|GE|LT|LE|NOT|AND|OR|XOR)\.|[\(\),=]|[*+\/\-]|$)/gd;
  let interTokens: string[] = []
  let prevIndex = -1;
  for (let match of line.matchAll(stmtSep)) {
    console.log(match);
    if( match[1] && match[1] !== "" )
      interTokens.push(match[1]);
  }
  return interTokens;
}

const classifyTokens = (tokens: string[]) => {
  return tokens.map( (t) => {
    let kwidTest = readKeywordOrIdentifer(t);
    if ( kwidTest && kwidTest.match )
      return kwidTest.token;
    let intTest = readInteger(t);
    if ( intTest && intTest.match )
      return intTest.token;
    //let complexTest = readComplex(t);
    //if ( complexTest && complexTest.match )
    //  return complexTest.token;
    let doubleTest = readDouble(t);
    if ( doubleTest && doubleTest.match )
      return doubleTest.token;
    let realTest = readReal(t);
    if ( realTest && realTest.match )
      return realTest.token;
    let logicalTest = readLogical(t);
    if ( logicalTest && logicalTest.match )
      return logicalTest.token;
    let logicOpTest = readLogicalOp(t);
    if ( logicOpTest && logicOpTest.match )
      return logicOpTest.token;
    let numOpTest = readNumericOp(t);
    if ( numOpTest && numOpTest.match )
      return numOpTest.token;
    let charToken = { tokenType: TokenType.Keyword, value: t };
    switch(t) {
      case "(":
        charToken.tokenType = TokenType.LeftParen;
        break;
      case ")":
        charToken.tokenType = TokenType.RightParen;
        break;
      case "=":
        charToken.tokenType = TokenType.Equals;
        break;
      case ",":
        charToken.tokenType = TokenType.Comma;
        break;
      default:
        throw "Unknown character: " + t;
    }
    return charToken;
  })
}

export const lexLine = (line: string) => classifyTokens(splitLine(line));
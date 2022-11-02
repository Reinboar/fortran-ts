import { lexLine, TokenType } from "./lexer"

enum StatementType {
  LogicalIf,
  NumericIf,
  DoLoop,
  Assignment,
  AlwaysGoTo,
  ComputedGoTo,
  AssignedGoTo,
  Continue,
  Pause,
  PauseOctal,
  PauseMessage,
  Stop,
  StopOctal,
  End,
}

type Token = {
  tokenType: TokenType,
  value: string | null,
}

class StatementParser {
  tokens: Token[];
  index: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.index = 0;
  }

  lookahead(tokenType: TokenType): boolean {
    if ( this.tokens[this.index] && this.tokens[this.index].tokenType == tokenType ) {
      this.index++;
      return true;
    }
    return false;
  }

  backtrack() {
    this.index--;
  }

  current() {
    return this.tokens[this.index];
  }

  eot() {
    return this.index >= this.tokens.length;
  }

  toString() {
    return this.tokens.map( e => e.value ).join(" ");
  }

  failToken() {
    if ( this.current() )
      throw `Unexpected token '${this.current().value}' in "${this.toString()}"`;
    this.failEnd();
  }

  failEnd() {
    throw "Unexpected EOL";
  }

  failExpectVal(s: string) {
    throw `Expected '${s}' instead of '${this.current().value}' in "${this.toString()}"`
  }

  failExpectType(t: TokenType) {
    
  }

  fail(s: string) {
    throw s;
  }
}

const literalValueRule = (sp: StatementParser) => {
  if ( sp.lookahead(TokenType.Real) || sp.lookahead(TokenType.Double) ||
        sp.lookahead(TokenType.Complex) || sp.lookahead(TokenType.Integer) ||
        sp.lookahead(TokenType.Logical) ) {
    return true;
  }
  return false;
}

const expressionOpRule = (sp: StatementParser) => {
  if ( sp.lookahead(TokenType.NumericOp) || sp.lookahead(TokenType.LogicalOp) ) {
    return true;
  }
  return false;
}

const expressionRule = (sp: StatementParser): boolean => {
  if ( sp.lookahead(TokenType.Identifier) || literalValueRule(sp) ) {
    if ( expressionOpRule(sp) ) {
      return expressionRule(sp);
    } else {
      return true;
    }
  }
  return false;
}

const assignmentRule = (sp: StatementParser) => {
  if ( sp.lookahead(TokenType.Identifier) ) {
    if ( sp.lookahead(TokenType.Equals) ) {
      if ( expressionRule(sp) ) {
        if ( sp.eot() ) {
          console.log("ASSIGNMENT");
          return true;
        }
        sp.failEnd();
      }
      sp.failToken();
    }
    sp.failToken();
  }
  return false;
}

const ifStatementNumericRule = (sp: StatementParser) => {
  if ( sp.lookahead(TokenType.Integer) ) {
    if ( sp.lookahead(TokenType.Comma) ) {
      if ( sp.lookahead(TokenType.Integer) ) {
        if ( sp.lookahead(TokenType.Comma) ) {
          if ( sp.lookahead(TokenType.Integer) ) {
            console.log("NUMERIC IF");
            return true;
          }
        }
      }
    }
    sp.failToken();
  }
  return false;
}

const ifStatementRule = (sp: StatementParser) => {
  if ( sp.current().value === "IF" && sp.lookahead(TokenType.Keyword) ) {
    if ( sp.lookahead(TokenType.LeftParen) ) {
      if ( expressionRule(sp) ) {
        if ( sp.lookahead(TokenType.RightParen) ) {
          if ( ifStatementNumericRule(sp) ) {
            // numeric if
            return true;
          }
          if ( nonIfAndDoStatementRule(sp) ) {
            // logical if
            console.log("LOGICAL IF");
            return true;
          }
          sp.fail("Invalid IF statement");
        }
        sp.failExpectVal(")")
      }
      sp.failToken();
    }
    sp.failExpectVal("(");
  }
  return false;
}

const nonIfAndDoStatementRule = (sp: StatementParser) => {
  if ( assignmentRule(sp) || returnStatementRule(sp) ) {
    return true;
  }
  return false;
}

const doStatementRule = (sp: StatementParser) => {
  if ( sp.current().value == "DO" && sp.lookahead(TokenType.Keyword) ) {
    if ( sp.lookahead(TokenType.Identifier) ) {
      if ( sp.lookahead(TokenType.Equals) ) {
        if ( sp.lookahead(TokenType.Integer) ) {
          if ( sp.lookahead(TokenType.Comma) ) {
            if ( sp.lookahead(TokenType.Integer) ) {
              if ( sp.lookahead(TokenType.Comma) ) {
                if ( sp.lookahead(TokenType.Integer) && sp.eot() ) {
                  console.log("DO STATEMENT: EXPLICIT INCREMENT")
                  return true;
                }
              } else if ( sp.eot() ) {
                console.log("DO STATEMENT: IMPLICIT INCREMENT")
                return true;
              }
            }
          }
        }
      }
    }
    sp.failToken();
  }
}

const programStatementRule = (sp: StatementParser) => {
  if ( sp.current().value == "PROGRAM" && sp.lookahead(TokenType.Keyword) ) {
    if ( sp.lookahead(TokenType.Identifier) ) {
      console.log("PROGRAM STATEMENT");
      return true;
    }
    sp.fail(`Invalid PROGRAM identifier '${sp.current().value}'`);
  }
}

const parameterListRule = (sp: StatementParser): boolean => {
  if ( sp.lookahead(TokenType.Identifier) ) {
    if ( sp.lookahead(TokenType.Comma) ) {
      return parameterListRule(sp);
    } else {
      return true;
    }
  }
  return false;
}

const subroutineStatementRule = (sp: StatementParser) => {
  if ( sp.current().value == "SUBROUTINE" && sp.lookahead(TokenType.Keyword) ) {
    if ( sp.lookahead(TokenType.Identifier) ) {
      if ( sp.lookahead(TokenType.LeftParen) ) {
        if ( parameterListRule(sp) ) {
          if ( sp.lookahead(TokenType.RightParen) && sp.eot() ) {
            console.log("SUBROUTINE STATEMENT");
            return true;
          }
        }
      }
    }
    sp.failToken();
  }
}

const returnStatementRule = (sp: StatementParser) => {
  if ( sp.current().value == "RETURN" && sp.lookahead(TokenType.Keyword) && sp.eot() ) {
    console.log("RETURN STATEMENT")
    return true;
  }
  return false;
}

const statementRule = (sp: StatementParser) => {
  if ( nonIfAndDoStatementRule(sp) || ifStatementRule(sp) || doStatementRule(sp) ||
      programStatementRule(sp) || subroutineStatementRule(sp) ) {
    return true;
  }
  return false;
}

let test = new StatementParser(lexLine("IF (A*23.EQ.91+B) RETURN"));
console.log(test);
console.log(statementRule(test));
console.log(test.current())
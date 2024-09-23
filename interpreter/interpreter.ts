import { dbToy } from "../db/db";
import { UserSchema } from "../db/type";
import { err, ok, type Result } from "../pkg/result";
import {
  CLAUSES,
  COMPARATOR,
  OPERATIONS,
  type Column,
  type Condition,
  type Values,
} from "./tokens";
import { convertType } from "../pkg/converters";

export const interpret = (query: string[]): Result<string, Error> => {
  while (query.length > 0) {
    const op = getOperation(query.shift() ?? "");
    if (op === undefined) {
      return err(Error("QUERY: not valid operation"));
    }

    switch (op) {
      case OPERATIONS.SELECT:
        const resSELECT = handleSelect(query);
        if (resSELECT.type === "err") {
          return err(resSELECT.value);
        }
        break;

      case OPERATIONS.UPDATE:
      case OPERATIONS.DELETE:
      case OPERATIONS.INSERT:
        const resInsert = handleInsert(query);
        if (resInsert.type === "err") {
          return err(resInsert.value);
        }

        return ok(resInsert.value);
    }
  }

  return ok("QUERY: successfully executed");
};
const getOperation = (x: string): OPERATIONS => {
  return OPERATIONS[x as keyof typeof OPERATIONS];
};

const handleInsert = (query: string[]): Result<string, Error> => {
  const values: Values = [];
  const columns: Column<string>[] = [];
  const into = getOperation(query.shift() ?? "");
  if (into === undefined) {
    return err(Error("INSERT: missing into"));
  }

  const tableName = query.shift();

  // TODO: give an error either the table doesn't exists
  if (tableName === undefined) {
    return err(Error("INSERT: missing table name"));
  }

  while (query.length > 0) {
    const column = handleColumns(query);
    if (column === undefined) {
      continue;
    }

    columns.push(column);

    if (isVALUES(query[0])) {
      const res = handleValues(query.slice(1));
      if (res === undefined) {
        continue;
      }
      values.push(...res);
      break;
    }
  }

  const res = execInsert(tableName, values, columns);
  if (res.type === "err") return err(res.value);

  return ok(res.value);
};
const execInsert = <T>(
  tableName: string,
  values: Values,
  columns: Column<T>[],
): Result<string, Error> => {
  const table = dbToy.get(tableName);
  if (table === undefined) {
    return err(Error(`INSERT: table (${tableName}) does not exists`));
  }

  type typeOfTable = (typeof table)[0];

  const newRow: Partial<typeOfTable> = {};
  for (let index = 0; index < columns.length; index++) {
    const col = columns[index];
    const key = col.value as keyof typeOfTable;
    let valueToValidate: any = values[index];

    const schemaShape = UserSchema.shape[key];

    if (schemaShape === undefined) {
      return err(
        Error(`COLUMN: ${col.value} does not exist in ${tableName} table`),
      );
    }

    const value = convertType(valueToValidate, schemaShape._def.typeName);

    const schema = UserSchema.pick({ [key]: true });
    const validationResult = schema.safeParse({ [key]: value });

    if (!validationResult.success) {
      return err(Error(`VALIDATION: Validation error on column: ${col.value}`));
    }

    newRow[key] = validationResult.data[key] as typeOfTable[keyof typeOfTable];
  }
  table.push(newRow as typeOfTable);
  return ok(`Row inserted: ${JSON.stringify(newRow)}`);
};

const handleValues = (query: string[]): string[] | undefined => {
  const values: Values = [];
  while (query.length > 0) {
    const value = query.shift();
    if (value === undefined) {
      return;
    }

    values.push(value);
  }

  return values;
};

const handleColumns = (query: string[]): Column<string> | undefined => {
  if (!isVALUES(query[0])) {
    const next = query.shift();
    if (next === undefined) {
      return;
    }

    return { value: next };
  }

  return;
};

const isVALUES = (x: string): boolean => {
  return OPERATIONS[x as keyof typeof OPERATIONS] === OPERATIONS.VALUES;
};

const handleSelect = (query: string[]): Result<null, Error> => {
  const columns: string[] = [];
  const tables: string[] = [];
  const conditons: Condition[] = [];
  while (query.length > 0) {
    const clause = getClauseOrCollum(query.shift() ?? "");
    if (clause === null) {
      return err(Error("CLAUSE: clause not valid"));
    }

    if (isColumn(clause)) {
      columns.push(clause.value);
      continue;
    }

    switch (clause) {
      case CLAUSES.WHERE:
        const resWhere = handleWHERE(query);
        if (resWhere.type === "err") {
          return err(resWhere.value);
        }

        conditons.push(resWhere.value);
        continue;
      case CLAUSES.FROM:
        const resFROM = handleFROM(query);
        if (resFROM.type === "err") {
          return err(resFROM.value);
        }
        tables.push(resFROM.value);
        continue;
    }
  }
  const result = execSelect(columns, tables, conditons);
  if (result.type === "err") {
    return err(result.value);
  }

  return ok(null);
};

const execSelect = (
  columns: string[],
  tables: string[],
  conditions: Condition[],
): Result<null, Error> => {
  while (tables.length > 0) {
    const tableName = tables.shift() ?? "";
    const table = dbToy.get(tableName);

    if (!table) {
      return err(Error(`FROM: Table '${tableName}' does not exist`));
    }

    type typeOfTable = (typeof table)[0];

    const results = table
      .map((tableRow) => {
        const rowResult: { [key: string]: any } = {};

        if (conditions.length === 0) {
          populateRowResult<typeOfTable>(columns, tableRow, rowResult);
          return rowResult;
        }

        for (const cond of conditions) {
          if (evaluateCondition<typeOfTable>(cond, tableRow)) {
            populateRowResult<typeOfTable>(columns, tableRow, rowResult);
            break;
          }
        }

        return Object.keys(rowResult).length > 0 ? rowResult : null;
      })
      .filter((row) => row !== null);

    console.log("Results: ", results);
  }

  return ok(null);
};

function populateRowResult<T>(
  columns: string[],
  tableRow: any,
  rowResult: { [key: string]: any },
) {
  columns.forEach((col) => {
    if (col in tableRow) {
      rowResult[col] = tableRow[col as keyof T];
    }
  });
}

function evaluateCondition<T>(cond: Condition, tableRow: any): boolean {
  const leftValue = tableRow[cond.left as keyof T];

  switch (cond.comparisson) {
    case COMPARATOR.NONE:
      return true;
    case COMPARATOR.EQUALS:
      return leftValue.toString() === cond.right;
    case COMPARATOR.GREATER:
      return Number(leftValue) > Number(cond.right);
    case COMPARATOR.MINOR:
      return Number(leftValue) < Number(cond.right);
    default:
      return false;
  }
}
const isColumn = (
  clause: CLAUSES | Column<string>,
): clause is Column<string> => {
  return (clause as Column<string>).value !== undefined;
};

const handleWHERE = (query: string[]): Result<Condition, Error> => {
  while (query.length > 0) {
    const left = query.shift();
    const comparator = getComparator(query.shift() ?? "");
    const right = query.shift();

    if (comparator === undefined || right === undefined || left === undefined) {
      return err(Error("WHERE: invalid comparator"));
    }

    return ok({ right: right, comparisson: comparator, left: left });
  }

  return err(Error("WHERE: needs a condition"));
};

const getComparator = (x: string): COMPARATOR | undefined => {
  return Object.values(COMPARATOR).find((enumValue) => enumValue === x);
};

const handleFROM = (query: string[]): Result<string, Error> => {
  const table = query.shift();
  if (table === undefined) {
    return err(Error("FROM: this clause needs a table"));
  }
  return ok(table);
};

const getClauseOrCollum = (x: string): CLAUSES | Column<string> | null => {
  if (x.length < 0) {
    return null;
  }
  const c = CLAUSES[x as keyof typeof CLAUSES];
  if (c === undefined) return { value: x };

  return c;
};

import { dbToy } from "../../db/db";
import { UserSchema } from "../../db/type";
import { convertType } from "../../pkg/converters";
import { err, ok, type Result } from "../../pkg/result";
import { OPERATIONS, type Column, type Values } from "../tokens";
import { getOperation } from "./operation";

export const handleInsert = (query: string[]): Result<string, Error> => {
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

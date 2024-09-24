import { z, ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";
import { dbToy } from "../../db/db";
import { convertType } from "../../pkg/converters";
import { err, isErr, ok, type Result } from "../../pkg/result";
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
    if (isErr(res)) return err(res.value);

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

    const result = inferSchemaFromData(table);
    if (isErr(result)) {
        return err(result.value);
    }

    const dynamicSchema = result.value;

    const newRow: Partial<typeOfTable> = {};
    for (let index = 0; index < columns.length; index++) {
        const col = columns[index];
        const key = col.value as keyof typeOfTable;
        let valueToValidate: any = values[index];

        const result = validateSchema(key, dynamicSchema, tableName, col, valueToValidate);
        if (isErr(result)) {
            return err(result.value);
        }

        const validationResult = result.value;

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

export const inferSchemaFromData = <T extends Record<string, any>>(
    data: T[],
): Result<ZodObject<{ [K in keyof T]: ZodTypeAny }>, Error> => {
    if (data.length === 0) {
        return err(Error("Cannot infer schema from empty data."));
    }

    const sample = data[0]; // Use the first entry to infer the schema
    const schemaShape = {} as { [K in keyof T]: ZodTypeAny };

    for (const key in sample) {
        const value = sample[key];

        if (typeof value === "string") {
            schemaShape[key] = z.string();
        } else if (typeof value === "number") {
            schemaShape[key] = z.number();
        } else if (typeof value === "boolean") {
            schemaShape[key] = z.boolean();
        } else {
            err(Error(`Unsupported type for key: ${key}`));
        }
    }

    return ok(z.object(schemaShape));
};

export const validateSchema = <T>(
    key: any,
    dynamicSchema: ZodObject<any>,
    tableName: string,
    column: Column<T>,
    val: any,
): Result<z.SafeParseSuccess<any>, Error> => {
    const schemaShape = dynamicSchema.shape[key];

    if (schemaShape === undefined) {
        return err(Error(`COLUMN: ${column.value} does not exist in ${tableName} table`));
    }

    const value = convertType(val, schemaShape._def.typeName);

    const schema = dynamicSchema.pick({ [key]: true });
    const validationResult = schema.safeParse({ [key]: value });

    if (!validationResult.success) {
        const errorMessage = validationResult.error.errors.map((err) => err.message).join(", ");

        return err(Error(`INSERT: not matched column '${key}' type (${errorMessage})`));
    }

    return ok(validationResult);
};

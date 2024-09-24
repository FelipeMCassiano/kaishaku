export enum OPERATIONS {
    SELECT = "SELECT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    INSERT = "INSERT",
    INTO = "INTO",
    VALUES = "VALUES",
    SET = "SET",
}

export enum CLAUSES {
    FROM = "FROM",
    WHERE = "WHERE",
}

export enum COMPARATOR {
    NONE = "",
    EQUALS = "=",
    GREATER = ">",
    MINOR = "<",
}

export type Values = string[];

export interface Column<T> {
    value: T;
}
export interface Assignment {
    column: Column<string>;
    assigner: COMPARATOR.EQUALS;
    value: string;
}

export interface Condition {
    right: string;
    comparisson: COMPARATOR;
    left: string;
}

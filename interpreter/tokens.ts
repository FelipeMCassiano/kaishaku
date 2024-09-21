export enum OPERATIONS {
    SELECT = "SELECT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    INSERT = "INSERT",
    INTO = "INTO",
    VALUES = "VALUES",
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

export interface Condition {
    right: string;
    comparisson: COMPARATOR;
    left: string;
}

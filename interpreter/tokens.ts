export enum OPERATIONS {
    SELECT = "SELECT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    INSERT = "INSERT",
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

export interface Collum {
    value: string;
}

export interface Table {
    value: string;
}

export interface Condition {
    right: string;
    comparisson: COMPARATOR;
    left: string;
}

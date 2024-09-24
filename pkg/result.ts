export type Result<O, E> = Ok<O> | Err<E>;

interface Ok<T> {
    type: "ok";
    value: T;
}
interface Err<T> {
    type: "err";
    value: T;
}

export const err = <T>(x: T): Err<T> => {
    return { value: x, type: "err" };
};

export const ok = <T>(x: T): Ok<T> => {
    return { value: x, type: "ok" };
};

export const isErr = <O, E>(x: Result<O, E>) => {
    return x.type === "err";
};

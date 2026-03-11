const typeConverters = {
    string: (value) => String(value),
    number: (value) => parseFloat(value),
    boolean: (value) => value === "true",
    Date: (value) => new Date(value),
    Array: (value) => JSON.parse(value),
} satisfies Record<string, (value: any) => any>;

export const convertType = <K extends keyof typeof typeConverters>(
    value: unknown,
    typeObj: K,
): ReturnType<(typeof typeConverters)[K]> => {
    const converter = typeConverters[typeObj];

    return converter(value);
};

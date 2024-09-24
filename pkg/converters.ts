const typeConverters = {
    ZodString: (value) => String(value),
    ZodNumber: (value) => parseFloat(value),
    ZodBoolean: (value) => value === "true",
    ZodDate: (value) => new Date(value),
    ZodArray: (value) => JSON.parse(value),
} satisfies Record<string, (value: any) => any>;

export const convertType = <K extends keyof typeof typeConverters>(
    value: unknown,
    typeObj: K,
): ReturnType<(typeof typeConverters)[K]> => {
    const converter = typeConverters[typeObj];

    return converter(value);
};

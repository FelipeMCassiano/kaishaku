import { interpret } from "./interpreter/interpreter";

function main() {
    const args = process.argv.slice(2);
    if (args.length > 1) {
        console.log("Usage: kaishaku [script]");
    }

    runPrompt();
}

function runPrompt() {
    while (true) {
        const line = prompt(">");
        if (line === null) break;

        run(line);
    }
}

function run(source: string) {
    const result = interpret(source.split(" "));
    if (result.type === "err") {
        console.error(result.value.message);
        return;
    }
}

main();

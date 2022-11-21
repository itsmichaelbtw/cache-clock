import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import bundleSize from "rollup-plugin-bundle-size";

import packageJson from "./package.json";

const extensions = [".ts"];
const banner = `/**
    * ${packageJson.homepage}
    * (c) ${new Date().getFullYear()} ${packageJson.author}
    * @license ${packageJson.license}
    */
`;

export default {
    input: "lib/cache-clock.ts",
    output: [
        {
            file: "dist/common/index.cjs",
            format: "cjs",
            sourcemap: true,
            exports: "named",
            generatedCode: {
                constBindings: true
            },
            banner: banner
        },
        {
            file: packageJson.module,
            format: "esm",
            sourcemap: true,
            exports: "named",
            banner: banner
        },
        {
            file: "dist/cache-clock.js",
            format: "umd",
            name: "CacheClock",
            sourcemap: true,
            exports: "named",
            banner: banner
        }
    ],
    plugins: [
        resolve({ extensions }),
        babel({
            babelHelpers: "bundled",
            include: ["lib/**/*.ts"],
            extensions: extensions,
            exclude: "node_modules/**",
            presets: ["@babel/preset-typescript", "@babel/preset-env"]
        }),
        bundleSize()
    ]
};

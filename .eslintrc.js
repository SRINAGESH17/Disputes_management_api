/**
 * ESLint configuration object.
 *
 * @property {Object} env - Specifies the environments for the code.
 * @property {boolean} env.node - Enables Node.js global variables and Node.js scoping.
 * @property {boolean} env.commonjs - Enables CommonJS global variables and CommonJS scoping.
 * @property {boolean} env.es2021 - Enables ES2021 global variables.
 * @property {string[]} extends - Array of configurations to extend.
 * @property {Object} parserOptions - Options for the parser.
 * @property {string} parserOptions.ecmaVersion - ECMAScript version to use for parsing.
 * @property {Object} rules - Custom rules for linting.
 * @property {Array|String} rules.no-unused-vars - Warns about unused variables. // Warns if variables are declared but not used
 * @property {string} rules.no-console - Allows use of console statements. // Disables warnings for console usage
 * @property {Array} rules['node/no-unsupported-features/es-syntax'] - Disallows unsupported ECMAScript syntax except modules. // Errors on unsupported ES syntax except modules
 * @property {string} rules['node/no-missing-import'] - Disables missing import checks. // Turns off missing import errors
 * @property {string} rules['node/no-unpublished-import'] - Disables unpublished import checks. // Turns off unpublished import errors
 * @property {string} rules['node/no-extraneous-import'] - Disables extraneous import checks. // Turns off extraneous import errors
 * @property {string} rules['security/detect-object-injection'] - Disables object injection detection. // Turns off object injection security rule
 * @property {Array} rules.eqeqeq - Enforces strict equality (=== and !==). // Requires use of === and !==
 * @property {string} rules.curly - Requires curly braces for all control statements. // Enforces curly braces for blocks
 * @property {Array} rules.semi - Requires semicolons at the end of statements. // Enforces semicolon usage
 */
export default {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        // Customize rules here
        "no-unused-vars": ["warn"],
        "no-console": "on",
        "node/no-unsupported-features/es-syntax": [
            "error",
            { "ignores": ["modules"] }
        ],
        "node/no-missing-import": "off",
        "node/no-unpublished-import": "off",
        "node/no-extraneous-import": "off",
        "security/detect-object-injection": "off",
        "eqeqeq": ["error", "always"],
        "curly": "error",
        "semi": ["error", "always"]
    },
};
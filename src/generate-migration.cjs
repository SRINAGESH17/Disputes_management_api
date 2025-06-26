const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get migration name from CLI args
const name = process.argv[2];
if (!name) {
    console.error("Please provide a migration name.");
    process.exit(1);
}

// Run sequelize migration:generate
execSync(`npx sequelize-cli migration:generate --name ${name}`, { stdio: "inherit" });

// Rename the latest generated .js file to .cjs
const migrationsPath = path.resolve("./src/migrations");
const files = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith(".js"))
    .map(file => ({
        file,
        time: fs.statSync(path.join(migrationsPath, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time); // Sort by newest first

if (files.length > 0) {
    const latest = files[0].file;
    const newName = latest.replace(/\.js$/, ".cjs");
    fs.renameSync(path.join(migrationsPath, latest), path.join(migrationsPath, newName));
    console.log(`Renamed ${latest} to ${newName}`);
}

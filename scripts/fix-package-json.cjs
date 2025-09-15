const fs = require("fs");

function readLock() {
  const lockPath = "package-lock.json";
  if (!fs.existsSync(lockPath)) {
    console.error("package-lock.json not found.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(lockPath, "utf8"));
}

function buildPkgFromLock(lock) {
  // npm v7+ lockfile has packages[""] as the root
  const root = (lock.packages && lock.packages[""]) || {
    name: lock.name,
    version: lock.version || "0.1.0",
    dependencies: lock.dependencies || {},
    devDependencies: lock.devDependencies || {},
  };

  const name = typeof root.name === "string" && root.name.trim() ? root.name : "radiant-ts";
  const version = typeof root.version === "string" && root.version.trim() ? root.version : "0.1.0";
  const dependencies = root.dependencies || {};
  const devDependencies = root.devDependencies || {};

  const pkg = {
    name,
    version,
    private: true,
    // Keep module type; .cjs files (like this one) still run as CommonJS.
    type: "module",
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      prepare: "husky install",
      format: "prettier . --write",
      "build:clean": "rimraf .next && npm run build"
    },
    dependencies,
    devDependencies,
  };

  return pkg;
}

(function main() {
  const lock = readLock();
  const pkg = buildPkgFromLock(lock);

  const out = JSON.stringify(pkg, null, 2) + "\n";
  // Write UTF-8 without BOM
  fs.writeFileSync("package.json", out, { encoding: "utf8", flag: "w" });

  // quick echo so we can eyeball
  console.log("package.json rebuilt:");
  console.log(out.slice(0, 180) + (out.length > 180 ? " " : ""));
})();

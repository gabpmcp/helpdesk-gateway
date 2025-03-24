#!/bin/bash

echo "📦 Installing required dependencies (Babel + ESLint plugins)..."

npm install --save-dev @babel/core @babel/cli @babel/preset-typescript eslint eslint-plugin-import eslint-plugin-node eslint-plugin-promise

echo "🛠️ Setting up Babel config..."

cat <<EOT > babel.config.json
{
  "presets": ["@babel/preset-typescript"]
}
EOT

echo "📄 Creating ESLint config compatible with ESLint 9..."

cat <<EOT > .eslintrc.json
{
  "env": {
    "es6": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 2021
  },
  "plugins": ["import", "node", "promise"],
  "rules": {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "semi": ["error", "never"],
    "quotes": ["error", "single"],
    "comma-dangle": ["error", "never"],
    "space-before-function-paren": ["error", "never"]
  }
}
EOT

echo "🚀 Transpiling TypeScript to JavaScript (output in dist/)..."

npx babel src --out-dir dist --extensions ".ts,.tsx"

echo "✅ Running ESLint validation on output JS..."

npx eslint dist/**/*.js || echo "⚠️ ESLint found issues, please review."

echo "📂 Copying non-code assets if any (optional)..."

cp -r src/**/*.json dist/ 2>/dev/null || true

if [ -d "tests" ]; then
  echo "🧪 Running tests (assuming you use npm test)..."
  npm test || echo "⚠️ Some tests failed! Review required!"
else
  echo "ℹ️ No tests directory detected, skipping tests..."
fi

echo "🎉 Migration complete! Check dist/ folder."
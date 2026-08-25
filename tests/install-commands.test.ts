import { describe, expect, it } from "vitest";
import { extractInstallPackages } from "../src/hook/install-commands.js";
import type { Ecosystem, PackageCheckInput } from "../src/core/types.js";

const pkg = (ecosystem: Ecosystem, name: string): PackageCheckInput => ({ ecosystem, name });
const npm = (name: string): PackageCheckInput => pkg("npm", name);
const pypi = (name: string): PackageCheckInput => pkg("pypi", name);

const cases: [string, PackageCheckInput[]][] = [
  // npm family
  ["npm install fastapi-auth-helper", [npm("fastapi-auth-helper")]],
  ["npm i -D @types/left-pad@^1 left-pad@latest", [npm("@types/left-pad"), npm("left-pad")]],
  ["npm add foo --save-exact", [npm("foo")]],
  ["npm install foo@1.0.0 --loglevel silent", [npm("foo")]],
  ["npm install my-alias@npm:real-package@1.0.0", [npm("real-package")]],
  ["npm install", []],
  ["npm ci", []],
  ["npm run build", []],
  ["npm install ./local-pkg", []],
  ["npm install ../sibling", []],
  ["npm install /abs/path", []],
  ["npm install file:../pkg", []],
  ["npm install git+https://github.com/x/y.git", []],
  ["npm install github:user/repo", []],
  ["npm install user/repo", []],
  ["npm install https://example.com/pkg.tgz", []],
  ["npm install pkg.tgz", []],
  ["npm install workspace:foo", []],
  ["pnpm add -D foo", [npm("foo")]],
  ["pnpm install foo", [npm("foo")]],
  ["pnpm i", []],
  ["pnpm add --filter api foo", [npm("foo")]],
  ["pnpm dlx create-thing@latest my-app", [npm("create-thing")]],
  ["yarn add foo bar", [npm("foo"), npm("bar")]],
  ["yarn dlx foo --flag", [npm("foo")]],
  ["yarn install", []],
  ["bun add foo", [npm("foo")]],
  ["bun install foo", [npm("foo")]],
  ["bun x foo", [npm("foo")]],
  ["bunx foo --version", [npm("foo")]],
  ["npx -y create-next-app@latest my-app --ts", [npm("create-next-app")]],
  ["npx --yes fastapi-auth-helper", [npm("fastapi-auth-helper")]],
  ["npx -p typescript tsc --init", [npm("typescript")]],
  ["npx --package=foo bar", [npm("foo")]],
  ["npx -c 'echo hi' foo", [npm("foo")]],

  // PyPI family
  ["pip install requests==2.32.3", [pypi("requests")]],
  ["pip install 'fastapi-auth-helper>=0.3' Flask", [pypi("fastapi-auth-helper"), pypi("flask")]],
  ["pip3 install foo[extra]~=1.0", [pypi("foo")]],
  ["pip install -r requirements.txt", []],
  ["pip install -e .", []],
  ["pip install .", []],
  ["pip install ./dist/foo-1.0-py3-none-any.whl", []],
  ["pip install foo @ https://example.com/foo.whl", []],
  ["pip install git+https://github.com/x/y", []],
  ["pip install --upgrade pip", [pypi("pip")]],
  ["python -m pip install foo", [pypi("foo")]],
  ["python3 -m pip install --user foo", [pypi("foo")]],
  ["python -m venv .venv", []],
  ["uv add 'foo>=1' --group dev", [pypi("foo")]],
  ["uv add --git https://github.com/x/y foo", []],
  ["uv add --path ../local foo", []],
  ["uv pip install foo bar", [pypi("foo"), pypi("bar")]],
  ["uv sync", []],
  ["uv tool install ruff", [pypi("ruff")]],
  ["uv tool run ruff check .", [pypi("ruff")]],
  ["uvx ruff check .", [pypi("ruff")]],
  ["uvx --from httpie http GET example.com", [pypi("httpie")]],
  ["uvx --with requests hallucinated-cli", [pypi("requests"), pypi("hallucinated-cli")]],
  ["uvx -w requests hallucinated-cli", [pypi("requests"), pypi("hallucinated-cli")]],
  ["uvx --with=requests hallucinated-cli", [pypi("requests"), pypi("hallucinated-cli")]],
  ["uvx --from httpie --with extra-plugin http", [pypi("extra-plugin"), pypi("httpie")]],
  ["pipx install foo", [pypi("foo")]],
  ["pipx run foo --help", [pypi("foo")]],
  ["pipx run --spec foo-pkg foo", [pypi("foo-pkg")]],
  ["poetry add foo@^1 --group dev", [pypi("foo")]],
  ["poetry install", []],
  ["pdm add foo", [pypi("foo")]],

  // crates
  ["cargo add serde --features derive tokio@1", [pkg("crates", "serde"), pkg("crates", "tokio")]],
  ["cargo add --path ../local mycrate", []],
  ["cargo add --git https://github.com/x/y mycrate", []],
  ["cargo install cargo-audit", [pkg("crates", "cargo-audit")]],
  ["cargo install --path .", []],
  ["cargo build --release", []],

  // Go
  ["go get github.com/foo/bar@v1.2.3", [pkg("go", "github.com/foo/bar")]],
  ["go get -u golang.org/x/tools/cmd/goimports@latest", [pkg("go", "golang.org/x/tools")]],
  ["go install github.com/foo/bar/cmd/tool@latest", [pkg("go", "github.com/foo/bar")]],
  ["go get gopkg.in/yaml.v3", [pkg("go", "gopkg.in/yaml.v3")]],
  ["go get -tags netgo example.com/mod/pkg", [pkg("go", "example.com/mod/pkg")]],
  ["go get ./...", []],
  ["go get .", []],
  ["go build ./...", []],
  ["go mod tidy", []],

  // RubyGems
  ["gem install rails -v 7.1", [pkg("rubygems", "rails")]],
  ["gem install foo:1.2 bar", [pkg("rubygems", "foo"), pkg("rubygems", "bar")]],
  ["bundle add rspec --group test", [pkg("rubygems", "rspec")]],
  ["bundle add foo --git https://github.com/x/y", []],
  ["bundle install", []],

  // Packagist
  ["composer require vendor/pkg:^1.0 --dev", [pkg("packagist", "vendor/pkg")]],
  ["composer require vendor/pkg ^1.0", [pkg("packagist", "vendor/pkg")]],
  ["composer require vendor/pkg=1.2", [pkg("packagist", "vendor/pkg")]],
  ["composer install", []],

  // NuGet
  ["dotnet add package Newtonsoft.Json --version 13.0.3", [pkg("nuget", "newtonsoft.json")]],
  ["dotnet add src/App/App.csproj package Foo.Bar", [pkg("nuget", "foo.bar")]],
  ["dotnet package add Foo.Bar --project x.csproj", [pkg("nuget", "foo.bar")]],
  ["dotnet build", []],

  // Alternate registries are not public registries: skip the whole command
  ["npm install private-pkg --registry https://npm.example.com", []],
  ["npm install --registry=https://npm.example.com private-pkg", []],
  ["pnpm add private-pkg --registry https://npm.example.com", []],
  ["npx --registry https://npm.example.com private-cli", []],
  ["pip install --index-url https://pypi.example.com/simple private-pkg", []],
  ["pip install -i https://pypi.example.com/simple private-pkg", []],
  ["pip install --extra-index-url https://pypi.example.com/simple private-pkg", []],
  ["pip install --no-index -f ./wheels private-pkg", []],
  ["uv add --index https://pypi.example.com/simple private-pkg", []],
  ["poetry add private-pkg --source internal", []],
  ["cargo add private-crate --registry internal", []],
  ["gem install private-gem --source https://gems.example.com", []],
  ["gem install -l private-gem", []],
  ["bundle add private-gem --source https://gems.example.com", []],
  ["dotnet add package Private.Pkg --source https://nuget.example.com/v3/index.json", []],
  ["npm_config_registry=https://npm.example.com npm install private-pkg", []],
  ["NPM_CONFIG_REGISTRY=https://npm.example.com npm install private-pkg", []],
  ["PIP_INDEX_URL=https://pypi.example.com/simple pip install private-pkg", []],
  ["GOPROXY=https://proxy.example.com go get example.com/private/mod", []],
  ["GOPRIVATE=example.com go get example.com/private/mod", []],
  ["env UV_INDEX_URL=https://pypi.example.com/simple uv add private-pkg", []],
  ["CARGO_REGISTRIES_INTERNAL_INDEX=https://x cargo add private-crate", []],
  ["CI=1 npm install foo", [npm("foo")]],

  // Chains, prefixes, redirections, quoting
  ["cd app && npm install foo; pip install bar || true", [npm("foo"), pypi("bar")]],
  ["npm install foo | tee log", [npm("foo")]],
  ["npm install foo > install.log 2>&1", [npm("foo")]],
  ["npm install foo >> log 2> err", [npm("foo")]],
  ["npm install foo &> log", [npm("foo")]],
  ["FOO=1 npm install foo", [npm("foo")]],
  ["sudo npm install -g foo", [npm("foo")]],
  ["sudo -u deploy npm install foo", [npm("foo")]],
  ["env CI=1 npm i foo", [npm("foo")]],
  ["command npm install foo", [npm("foo")]],
  ["/usr/local/bin/npm install foo", [npm("foo")]],
  ["npm install foo\npip install bar", [npm("foo"), pypi("bar")]],
  ["npm install foo foo", [npm("foo")]],
  ["npm install \"foo\" 'bar'", [npm("foo"), npm("bar")]],
  ["npm install 'foo; rm -rf /'", []],
  ["npm install -- foo", [npm("foo")]],
  ["echo 'npm install foo'", []],
  ["git commit -m 'npm install foo'", []],
  ["cat package.json", []],
  ["ls -la", []],
  ["", []],

  // Registry variables that persist for the rest of the line
  ["export PIP_INDEX_URL=https://pypi.example.com/simple; pip install private-pkg", []],
  ["export PIP_INDEX_URL=https://pypi.example.com/simple && npm install foo", [npm("foo")]],
  ["PIP_INDEX_URL=https://pypi.example.com/simple; pip install private-pkg", []],
  ["PIP_INDEX_URL=x pip install a; pip install b", [pypi("b")]],
  ["NPM_CONFIG_REGISTRY=https://npm.example.com\nexport NPM_CONFIG_REGISTRY\nnpm install private-pkg", []],
  ["export GOPROXY=direct GOFLAGS=-mod=mod; go get example.com/private/mod", []],
  ["declare -x CARGO_REGISTRIES_INTERNAL_INDEX=https://x; cargo add private-crate", []],

  // Quoted command substitutions still execute
  ["echo \"$(npm install foo)\"", [npm("foo")]],
  ["echo \"`npm install foo`\"", [npm("foo")]],
  ["echo \"prefix $(pip install bar) suffix\"", [pypi("bar")]],
  ["echo \"$(npm install foo) and $(pip install bar)\"", [npm("foo"), pypi("bar")]],
  ["echo \"$(echo $(npm install foo))\"", [npm("foo")]],
  ["OUT=\"$(npm install foo)\"", [npm("foo")]],
  ["echo '$(npm install foo)'", []],
  ["echo \"\\$(npm install foo)\"", []],
  ["echo \"\\`npm install foo\\`\"", []],

  // Heredoc bodies and here-strings are data, not commands
  ["cat > setup.sh <<'EOF'\nnpm install example-package\nEOF", []],
  ["cat > setup.sh <<EOF\npip install example-package\nEOF", []],
  ["cat > setup.sh << \"EOF\"\nnpm install example-package\nEOF", []],
  ["cat <<-EOF\n\tnpm install example-package\n\tEOF", []],
  ["cat <<EOF\nnpm install example-package\nEOF\nnpm install real-package", [npm("real-package")]],
  ["cat <<A <<B\nnpm install x\nA\npip install y\nB\nnpm install z", [npm("z")]],
  ["tee script.sh <<'EOF' > /dev/null\nnpm install example-package\nEOF", []],
  ["grep install <<< \"npm install foo\"", []],
  ["cat <<EOF\nno delimiter line, body runs to the end\nnpm install example-package", []],

  // Shell control flow, grouping, comments, continuations
  ["if test -f package.json; then npm install foo; fi", [npm("foo")]],
  ["if ! npm install foo; then exit 1; fi", [npm("foo")]],
  ["if true; then echo skip; else pip install bar; fi", [pypi("bar")]],
  ["while true; do npm install foo; done", [npm("foo")]],
  ["until npm install foo; do sleep 1; done", [npm("foo")]],
  ["for p in a b; do pip install $p; done", []],
  ["(cd app && npm install foo)", [npm("foo")]],
  ["echo $(npm install foo)", [npm("foo")]],
  ["echo `npm install foo`", [npm("foo")]],
  ["{ npm install foo; }", [npm("foo")]],
  ["npm install foo # && pip install bar", [npm("foo")]],
  ["# npm install foo", []],
  ["echo hi # npm install foo", []],
  ["npm install \\\n  foo \\\n  bar", [npm("foo"), npm("bar")]],
  ["npm install \"foo\\\nbar\"", [npm("foobar")]]
];

describe("extractInstallPackages", () => {
  it.each(cases)("%s", (command, expected) => {
    expect(extractInstallPackages(command, {})).toEqual(expected);
  });

  it("skips ecosystems whose registry is overridden in the inherited environment", () => {
    const env = { PIP_INDEX_URL: "https://pypi.example.com/simple", npm_config_registry: "https://npm.example.com" };
    expect(extractInstallPackages("pip install a && npm install b && cargo add c", env)).toEqual([
      pkg("crates", "c")
    ]);
    expect(extractInstallPackages("pip install a", { PIP_INDEX_URL: "" })).toEqual([pypi("a")]);
  });
});

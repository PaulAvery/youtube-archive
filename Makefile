BIN = ./node_modules/.bin
SRC = src
LIB = lib
TEST = test
DOCS = docs
DOCS_OUT = docs_out
DOCS_BRANCH = gh-pages
LINE_COVERAGE = 100
BRANCH_COVERAGE = 100
FUNCTION_COVERAGE = 100
REPORTER_COVERAGE = html

# Load makefile config so we can override anything set above
# CURDIR is used to prevent searching in include dirs
-include $(CURDIR)/.makerc

# Go three levels deep. Extend as neccessary
SRCFILES = $(wildcard src/*.js) $(wildcard src/*/*.js) $(wildcard src/*/*/*.js)
LIBFILES = $(patsubst $(SRC)/%.js,$(LIB)/%.js,$(SRCFILES))

## Default Task
default: build docs

## Utility
# Installs npm dependencies
node_modules: package.json
	@echo '### Installing packages'
	@npm install --progress false

# Checks if we have anything uncommited in our directory
check-commit:
	@git diff-index --quiet HEAD || (echo 'Uncommited changes!' && false)

## Build
# Build each file via babel
$(LIB)/%.js: $(SRC)/%.js node_modules
	@mkdir -p ${@D}
	@echo '$< => $@'
	@$(BIN)/babel $< --out-file $@

# Build all files
build: $(LIBFILES)

# Watch the source directory and rebuild as neccessary
watch: node_modules
	@echo '### Watching $(SRC)'
	@while true; do \
		inotifywait -qqr $(SRC) -e modify -e create -e delete -e move -e moved_to -e moved_from; \
		make build -s; \
	done

## Documentation
# Make sure we have our target directory so we can later push to gh-pages branch
$(DOCS_OUT)/.git:
	@echo '### Fetching $(DOCS_BRANCH) branch from remote'
	@rm --preserve-root -rf $(DOCS_OUT)
	@git clone -b $(DOCS_BRANCH) `git remote get-url origin` $(DOCS_OUT)

# Build documentation
docs: node_modules $(DOCS_OUT)/.git
	@rm --preserve-root -rf $(DOCS_OUT)/*
	@echo '### Building docs'
	@PAULAVERY_DOCS_IN='$(DOCS)' PAULAVERY_DOCS_OUT='$(DOCS_OUT)' $(BIN)/docs

# Serve documentation and rebuild as neccessary
serve-docs: docs
	@./node_modules/.bin/static-server $(DOCS_OUT) > /dev/null &
	@echo 'Go to http://localhost:9080'
	@while true; do \
		inotifywait -qqr $(DOCS) package.json -e modify -e create -e delete -e move -e moved_to -e moved_from; \
		make docs -s; \
	done

# Commit documentation to gh-pages branch if neccessary and then push it
publish-docs: check-commit docs
	@cd $(DOCS_OUT) && git add -A
	@cd $(DOCS_OUT) && git diff-index --quiet HEAD || (echo '### Commiting documentation' && git commit -m 'Rebuild documentation '`cd ../ && git rev-parse HEAD`)
	@echo '### Pushing documentation'
	@cd $(DOCS_OUT) && git push

## Project Management
# Remove all built files
clean:
	@echo '### Removing $(LIB), $(DOCS_OUT), node_modules, coverage and .nyc_output'
	@rm --preserve-root -rf $(LIB)
	@rm --preserve-root -rf $(DOCS_OUT)
	@rm --preserve-root -rf node_modules
	@rm --preserve-root -rf coverage
	@rm --preserve-root -rf .nyc_output

# Run linter
lint: node_modules
	@$(BIN)/eslint $(SRC) $(TEST)

# Run tests including coverage
test: node_modules lint
	@$(BIN)/nyc --check-coverage --lines $(LINE_COVERAGE) --functions $(FUNCTION_COVERAGE)  --branches $(BRANCH_COVERAGE) --reporter $(REPORTER_COVERAGE) -- $(BIN)/ava --require babel-register --timeout 10s

# Create a major release after building and checking everything
relase-major: check-commit build test
	@npm version major

# Create a minor release after building and checking everything
relase-minor: check-commit build test
	@npm version minor

# Create a patch release after building and checking everything
relase-patch: check-commit build test
	@npm version patch

# Publish to git remote as well as npm
publish: check-commit build test publish-docs
	@echo '### Pushing to git remote'
	@git push --tags origin HEAD:master
	@echo '### Publishing to npm'
	@npm publish

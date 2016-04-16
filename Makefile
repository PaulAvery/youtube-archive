SRC = src
LIB = lib
BIN = ./node_modules/.bin
DOCS = docs
DOCS_OUT = docs_out

default: build docs

## Utility
node_modules: package.json
	@npm install

check-commit:
	@git diff-index --quiet HEAD || (echo 'Uncommited changes!' && false)

## Build
build: node_modules
	@$(BIN)/babel $(SRC) --out-dir $(LIB)

watch: node_modules
	@$(BIN)/babel --watch src --out-dir $(LIB)

## Documentation
$(DOCS_OUT)/.git:
	@rm --preserve-root -rf $(DOCS_OUT)
	@git clone -b gh-pages `git remote get-url origin` $(DOCS_OUT)

docs: node_modules $(DOCS_OUT)/.git
	@rm --preserve-root -rf $(DOCS_OUT)/*
	@PAULAVERY_DOCS_IN='$(DOCS)' PAULAVERY_DOCS_OUT='$(DOCS_OUT)' $(BIN)/docs

serve-docs: docs
	@./node_modules/.bin/static-server $(DOCS_OUT) > /dev/null &
	@echo "Go to http://localhost:9080"
	@while true; do \
		inotifywait -qqr $(DOCS) package.json -e modify -e create -e delete -e move -e moved_to -e moved_from; \
		make docs -s; \
	done

publish-docs: check-commit docs
	@cd $(DOCS_OUT) && git add -A
	@cd $(DOCS_OUT) && git diff-index --quiet HEAD || git commit -m 'Rebuild documentation '`cd ../ && git rev-parse HEAD`
	@cd $(DOCS_OUT) && git push

## Project Management
clean:
	@rm --preserve-root -rf $(LIB)
	@rm --preserve-root -rf $(DOCS_OUT)
	@rm --preserve-root -rf node_modules

lint:
	@$(BIN)/eslint $(SRC)

test: lint build
	@$(BIN)/mocha --require must

relase-major: check-commit build test
	@npm version major

relase-minor: check-commit build test
	@npm version minor

relase-patch: check-commit build test
	@npm version patch

publish: check-commit build test publish-docs
	@git push --tags origin HEAD:master
	@npm publish

NODE = node

test:
	@$(NODE) node_modules/mocha/bin/mocha --ui tdd --reporter spec $(FILE)

.PHONY: test
.PHONY: generate preview studio test setup clean

generate:
	node scripts/generate.mjs $(filter-out $@,$(MAKECMDGOALS))

preview:
	node scripts/generate.mjs $(filter-out $@,$(MAKECMDGOALS)) --preview

studio:
	npm start

test:
	npx vitest run
	pixi run python -m pytest tests/ -v -p no:playwright
	npx tsc --noEmit --skipLibCheck

setup:
	pixi install && npm install

clean:
	rm -f public/audio.* src/transcript.json

# Prevent make from treating extra args as targets
%:
	@:

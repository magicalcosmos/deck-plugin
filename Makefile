build:
	cd plugin-client && npm run deploy
dev:
	cd plugin-client && npm run build
zip:
	node plugin-client/zip.js
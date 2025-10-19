.PHONY: build dev tidy test clean

build:
	wails build

dev:
	wails dev

tidy:
	GOCACHE=$(PWD)/.gocache GOFLAGS=-mod=mod go mod tidy

test:
	GOCACHE=$(PWD)/.gocache go test ./...

clean:
	rm -rf .gocache
	rm -rf build
	rm -rf frontend/dist

package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {

	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "Micrypt",
		Width:  1000,
		Height: 700,
		MinWidth:  800,
		MinHeight: 600,
		MaxWidth:  2560,
		MaxHeight: 1600,
		StartHidden: false,
		Frameless: false,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 232, G: 236, B: 241, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
			WebviewIsTransparent: true,
			WindowIsTranslucent: false,
			About: &mac.AboutInfo{
				Title:   "Micrypt",
				Message: "Secure file encryption vault\n\nA secure, encrypted file storage application with military-grade encryption.",
			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

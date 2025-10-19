![Micrypt logo](build/appicon.png)

# Micrypt

Micrypt is een desktop kluis die bestanden beveiligt met sterke encryptie via Go en Wails.

## Overzicht encryptie

Micrypt leidt hoofdsleutels af met argon2id op basis van wachtwoorden, optionele PIM waarden en optionele keyfiles. Bestanden worden standaard versleuteld met aes256 gcm, met cascade opties die serpent256 gcm en twofish256 gcm toevoegen. Elk bestand krijgt unieke nonces en integriteitscodes zodat wijziging wordt ontdekt. Vault metadata en de herstelzin zijn eveneens versleuteld met aes256 gcm.

## Voorwaarden

1. Go 1.24 of hoger
2. Node 18 of hoger
3. npm

## Installatie

Voer de frontend installatie uit.

```sh
cd frontend
npm install
cd ..
```

## Ontwikkeling

Start de desktop ontwikkelmodus.

```sh
make dev
```

## Productiebouw

Maak een distributie build.

```sh
make build
```



## Data Flow

1. De React interface stuurt opdrachten naar de Wails runtime.
2. De Go backend voert de vault logica uit voor encryptie en decryptie.
3. Versleutelde bestanden en metadata worden opgeslagen in het mvault containerbestand.

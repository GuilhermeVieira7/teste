# GRG Viagens — V3 "O mundo não foi feito para ficar na sua lista."

Vídeo final: `out/grg-viagens-v3.mp4` — 1080x1920, 30 fps, 24,5 s. Motion design 100% autoral (sem banco de imagens),
com motion blur real (3 subquadros/quadro), granulação de filme e sound design próprio.

Arco: DESEJO → DESTINO → EXPERIÊNCIA → GRG.

| Tempo | Cena | Som |
|---|---|---|
| 0–2,5s | "E SE VOCÊ…" + flashes cinematográficos (Paris, Maldivas, Nova York, Cancún, Roma) → **FOSSE?** | ambiente de aeroporto, chime de embarque, cliques de painel, reverse swell → bass hit |
| 2,5–5,5s | Transição em lâminas (painel virando) → painel de partidas split-flap. "PARA ONDE…" / "…VOCÊ IRIA?" | cada placa do painel tem seu clique sincronizado |
| 5,5–8,25s | Passaporte em close com profundidade de campo; 4 carimbos, cada um abre uma microcena do destino. "COLECIONE DESTINOS." | carimbos, whooshes |
| 8,25–9,75s | Pausa em silêncio → **VIVA HISTÓRIAS.** (paisagem dentro das letras) e zoom através do "Ó" | silêncio → hit + pad |
| 9,75–12,75s | Decolagem, janela, oceano, hotel, cidade, praia, jantar, paisagem. "Não é sobre chegar." | passagem de avião, groove completo |
| 12,75–13,75s | "É sobre" → **VIVER.** (oceano dentro das letras) | silêncio → hit mais grave do vídeo |
| 13,75–17s | Marca entra: "Você escolhe o destino. A GRG cuida do resto." + 6 serviços com ícones próprios | UI clicks |
| 17–20,5s | Mapa GRU → FCO + "Sua viagem: Roma, Itália" com tudo confirmado. "Menos preocupação." → **Mais mundo.** | confirmações, hit |
| 20,5–24,5s | Globo e órbitas sutis, logo, "Sua próxima história começa aqui.", "Fale com a GRG", grgviagens.com.br | resolução em Ré maior, chime final |

## Regerar
```bash
pip install numpy scipy imageio-ffmpeg
python3 music.py
FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())") node render.js
```
`art.js` = cenas/ilustrações dos destinos; `main.js` = roteiro, tipografia, interface e transições.

# GRG Viagens — vídeo motion graphics (Reels / TikTok / Shorts)

Vídeo final: `out/grg-viagens-reels.mp4` — 1080x1920, 30 fps, 22 s, trilha própria (sem direitos autorais).

## Roteiro
| Tempo | Cena |
|---|---|
| 0–2,5s | Gancho: "SE VOCÊ PUDESSE EMBARCAR **HOJE**" (impacto no drop) |
| 2,5–7s | Painel de partidas estilo aeroporto: "PARA ONDE VOCÊ IRIA?" — seletor tipo roleta para em MALDIVAS, carimbo "EMBARQUE IMEDIATO" |
| 7–11s | "COLECIONE DESTINOS." — carimbos de passaporte no ritmo da batida + contador de destinos |
| 11–15s | "VIVA HISTÓRIAS." — polaroids + checklist: passagens, hotéis, pacotes, cotação personalizada |
| 15–18s | Revelação da logo com avião orbitando, brilho e slogan |
| 18–22s | CTA: "COMENTA AQUI pra onde você iria 👇", cotação no direct, @grgviagens, site. Final volta à cor inicial (loop contínuo) |

## Como regerar
```bash
pip install numpy scipy imageio-ffmpeg
python3 music.py                       # gera assets/music.wav
FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())") node render.js
```
Abra `index.html` no navegador para pré-visualizar (clique para tocar com áudio).

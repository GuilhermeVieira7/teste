# GRG Viagens — vídeo "energia" (Reels / TikTok / Shorts)

Vídeo final: `out/grg-viagens-energia.mp4` — 1080x1920, 30 fps, 25 s, trilha tropical house própria (120 BPM), cortes no ritmo.

| Tempo | Cena |
|---|---|
| 0–1,5s | Contagem "SUAS FÉRIAS COMEÇAM EM 3, 2, 1" em cores fortes |
| 1,5–2,5s | "EMBARQUE LIBERADO!" + cartão de embarque: passageiro VOCÊ, de ~~ROTINA~~ para FÉRIAS! |
| 2,5–8,5s | 6 destinos ilustrados, 1 por segundo: Cancún, Paris, Gramado, Maldivas, Orlando, Noronha |
| 8,5–10s | Recap relâmpago dos destinos |
| 10–11s | "E QUEM ORGANIZA TUDO?" |
| 11–14,5s | Logo explode com confete — "DEIXA COM A GENTE!" + passagens, hotéis, pacotes, atendimento VIP |
| 14,5–18s | "VOCÊ SÓ FAZ A MALA." — óculos, chinelo, câmera, passaporte e protetor voam pra mala, ela fecha e ganha adesivos |
| 18–22s | Conversa no direct: cliente pede Cancún, a GRG responde na hora |
| 22–25s | "CHAMA NO DIRECT!" + @grgviagens + "marca quem vai com você 👇" (volta ao amarelo do início → loop) |

## Regerar
```bash
pip install numpy scipy imageio-ffmpeg
python3 music.py
FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())") node render.js
```

# GRG Viagens — "toda viagem começa com um risco"

Vídeo final: `out/grg-viagens-um-risco.mp4` — 1080x1920, 30 fps, 24 s, trilha lo-fi própria.

Conceito: uma única linha desenhada à mão atravessa o vídeo em papel claro — vira montanha, mar com pôr do sol,
Torre Eiffel e a casa de volta — e no fim decola como avião e fecha o círculo da logo.

| Tempo | Texto | Desenho |
|---|---|---|
| 0–3s | toda viagem começa com um *risco.* | ponto → linha |
| 3–6s | o de sair do *lugar,* | montanhas (Bariloche) |
| 6–9s | o de trocar a rotina por *maré,* | mar + pôr do sol (Maragogi) |
| 9–12s | o de ver de perto o que só via em *foto,* | Torre Eiffel (Paris) |
| 12–15s | e voltar pra casa *diferente.* | casa |
| 15–18s | você escolhe o *destino.* a gente traça o *caminho.* | linha vira avião e fecha o círculo → logo |
| 18–24s | @grgviagens · e o seu próximo *risco?* me conta nos comentários | final em loop |

## Regerar
```bash
pip install numpy scipy imageio-ffmpeg
python3 music.py
FFMPEG=$(python3 -c "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())") node render.js
```

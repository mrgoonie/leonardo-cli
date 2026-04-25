# Image Models — Selection Guide

Image models are UUIDs. Run `leo models` to fetch the live list; the IDs change as Leonardo adds families. Below are stable picks (verified 2026-04) by use case.

## Curated picks

| Use case | Model | UUID |
|---|---|---|
| Photoreal / general | Lucid Origin | `7b592283-e8a7-4c5a-9ba6-d18c31f258b9` |
| Photoreal v2 | Phoenix 1.0 | `de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3` |
| Cinematic / portraits | Kino XL | `aa77f04e-3eec-4034-9c07-d0f619684628` |
| Anime | Anime XL | `e71a1c2f-4f80-4800-934f-2c68979d8cc8` |
| 3D rendered | 3D Animation Style | `d69c8273-6b17-4a30-a13e-d6637ae1c644` |
| Flux ecosystem | Flux Dev/Schnell | check `leo models` |

## Tuning flags

| Flag | Effect | When to use |
|---|---|---|
| `--alchemy` | Higher quality, slower, more credits | Final renders |
| `--ultra` | Ultra mode (Phoenix/Lucid only) | Premium quality |
| `--contrast <1.0–4.5>` | Image contrast | 3.0–3.5 for portraits |
| `--style <uuid>` | Style preset | Match aesthetic |
| `--seed <n>` | Reproducible output | A/B prompts |
| `--negative <text>` | Negative prompt | Strip artifacts |
| `--enhance` | Auto-improve prompt | Short prompts |
| `-w/-h` | Width/height | 1024×1024 default; 1536×1024 landscape |
| `-n <n>` | Batch count | Variations (forces directory output) |

## Cost awareness

- Alchemy doubles credits.
- Ultra mode costs ~3× base.
- Larger dimensions (>1024) cost more.
- Always run `leo me` to check remaining credits before large batches.

## Patterns

```bash
# Fast iteration (small, no alchemy)
leo generate "<prompt>" -w 512 -h 512 --no-download --json

# Final hero shot
leo generate "<prompt>" -m 7b592283-e8a7-4c5a-9ba6-d18c31f258b9 \
  --alchemy --ultra --contrast 3.5 -w 1024 -h 1024 -o hero.png

# Batch of 4 variations with seed control
leo generate "<prompt>" -d ./outputs -n 4 --seed 42
```

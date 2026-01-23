# Calcul Rebuturi

## Scop
Calcularea totalurilor pentru materialele pierdute (rebuturi) din toate ieșirile înregistrate.

## Logică
1. Se filtrează lista de `iesiri` pentru a păstra doar înregistrările unde `motiv === 'rebut'`.
2. Se iterează prin aceste înregistrări și se însumează valorile din obiectul `materiale`:
    - `litri`
    - `capace`
    - `etichete`
    - `cutii`
    - `sticle`
    - `keguri`
3. Pentru valoarea `litri`, rezultatul final trebuie formatat cu 2 zecimale (`.toFixed(2)`).

## Input
- Array `iesiri` (lista completă de ieșiri din DB).

## Output
- Obiect `totaluriGenerale` cu cheile de mai sus și valorile însumate.

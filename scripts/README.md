# Scripts

## Database Update

### Running the Database Update

To fetch the latest character and weapon data from **Paimon.moe GitHub**, run:

```bash
node update_database.js
```

This script automatically downloads the latest game data from the Paimon.moe repository and updates your local database files in the `public/data/` directory.

### When to Run

- When starting fresh development
- Before deploying to ensure you have the latest game data
- When new characters or weapons are added to the game
- After pulling changes from the repository

### Data Sources

- **Characters:** `characters.json`
- **Weapons:** `weaponList.json`

These files are pulled from the [Paimon.moe GitHub repository](https://github.com/MasterEric/Paimon.moe) and stored in `public/data/`.

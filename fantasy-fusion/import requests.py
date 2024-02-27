import requests
import psycopg2
import psycopg2.extras

# Function to normalize names for matching
def normalize_name(name):
    return ''.join(e.lower() for e in name if e.isalnum())

# Fetch Sleeper player data
sleeper_response = requests.get('https://api.sleeper.app/v1/players/nfl')
sleeper_players = sleeper_response.json()

# Normalize Sleeper names and create a mapping to their IDs
sleeper_name_to_id = {normalize_name(p["full_name"]): p["player_id"] for p in sleeper_players.values() if "full_name" in p}

# Connect to your PostgreSQL database
conn = psycopg2.connect("postgresql://postgres@localhost:5433/postgres")
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

# Check if the sleeper_player_id column exists and create it if it doesn't
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='nfl_stats_2013' AND column_name='sleeper_player_id';")
if cur.rowcount == 0:
    cur.execute("ALTER TABLE nfl_stats_2013 ADD COLUMN sleeper_player_id VARCHAR;")

cur.execute("SELECT rank, player FROM nfl_stats_2013")
db_players = cur.fetchall()

# Create a mapping based on normalized names
for db_player in db_players:
    normalized_name = normalize_name(db_player['player'])
    sleeper_id = sleeper_name_to_id.get(normalized_name)

    if sleeper_id:
        # Update your existing table with Sleeper IDs
        cur.execute("""
            UPDATE nfl_stats_2013
            SET sleeper_player_id = %s
            WHERE rank = %s;
        """, (sleeper_id, db_player['rank']))

cur.execute("DELETE FROM nfl_stats_2013 WHERE sleeper_player_id IS NULL;")

# Commit changes to the database and close the connection
conn.commit()
cur.close()
conn.close()

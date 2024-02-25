from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import requests
from functools import lru_cache
from flask_cors import CORS
import os
import logging
from sqlalchemy.exc import SQLAlchemyError


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres@localhost:5433/postgres'
db = SQLAlchemy(app)
CORS(app)
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    return "Welcome to the Fantasy Fusion API!"

class NFLStatsBase(db.Model):
    __abstract__ = True
    rank = db.Column(db.Integer, primary_key=True)
    player = db.Column(db.Text, nullable=False)
    tm = db.Column(db.Text)
    fantpos = db.Column(db.Text)
    age = db.Column(db.Integer)
    g = db.Column(db.Integer)
    gs = db.Column(db.Integer)
    cmp = db.Column(db.Integer)
    att = db.Column(db.Integer)
    yds = db.Column(db.Integer)
    td = db.Column(db.Integer)
    int = db.Column(db.Integer)
    att_rushing = db.Column(db.Integer)
    yds_rushing = db.Column(db.Integer)
    ya = db.Column(db.Float)
    td_rushing = db.Column(db.Integer)
    tgt = db.Column(db.Integer)
    rec = db.Column(db.Integer)
    yds_receiving = db.Column(db.Integer)
    yr = db.Column(db.Float)
    td_receiving = db.Column(db.Integer)
    fmb = db.Column(db.Integer)
    fl = db.Column(db.Integer)
    td_other = db.Column(db.Integer)
    twopm = db.Column(db.Integer)
    twopp = db.Column(db.Integer)
    fantpt = db.Column(db.Integer)
    ppr = db.Column(db.Float)
    vbd = db.Column(db.Integer)
    posrank = db.Column(db.Integer)
    ovrank = db.Column(db.Integer)
    sleeper_player_id = db.Column(db.Integer)


class NFLStats2017(NFLStatsBase):
    __tablename__ = 'nfl_stats_2017'

class NFLStats2018(NFLStatsBase):
    __tablename__ = 'nfl_stats_2018'

class NFLStats2019(NFLStatsBase):
    __tablename__ = 'nfl_stats_2019'

class NFLStats2020(NFLStatsBase):
    __tablename__ = 'nfl_stats_2020'

class NFLStats2021(NFLStatsBase):
    __tablename__ = 'nfl_stats_2021'

class NFLStats2022(NFLStatsBase):
    __tablename__ = 'nfl_stats_2022'

class NFLStats2023(NFLStatsBase):
    __tablename__ = 'nfl_stats_2023'

# Other imports...

@app.route('/api/stats/2023', methods=['GET'])
def get_2023_stats():
    try:
        stats = NFLStats2023.query.limit(5).all()  # Adjust this as needed
        app.logger.info(f"Fetched {len(stats)} records from NFLStats2023.")
        
        # Serialize the data for JSON response
        stats_list = [
            {'player': stat.player, 'yards': stat.yds, 'touchdowns': stat.td, 'ppg': stat.ppr / stat.g if stat.g else 0}
            for stat in stats
        ]
        return jsonify(stats_list)
    except Exception as e:
        app.logger.error(f"Failed to fetch 2023 stats: {e}")
        return jsonify({'error': 'Failed to fetch data'}), 500


@app.route('/api/stats/2023/player/<int:sleeper_player_id>', methods=['GET'])
def get_player_stats_by_id(sleeper_player_id):
    logging.debug("Received request for player with sleeper_player_id: %s", sleeper_player_id)

    try:
        # Check database connection and query construction
        logging.debug("Constructing database query for sleeper_player_id: %s", sleeper_player_id)
        player_stats = NFLStats2023.query.filter_by(sleeper_player_id=int(sleeper_player_id)).first()


        logging.debug("Query result: %s", player_stats)

        if player_stats:
            # Found the player, return their stats
            return jsonify({
                'player': player_stats.player,
                'yards': player_stats.yds,
                'touchdowns': player_stats.td,
                'ppg': player_stats.ppr / player_stats.g if player_stats.g else 0
            })
        else:
            # No player found with that ID
            return jsonify({'error': 'Player not found with sleeper_player_id={}'.format(sleeper_player_id)}), 404

    except Exception as e:
        logging.error(f"Failed to fetch player stats for ID {sleeper_player_id}: {e}")
        raise  # Re-raise the exception to allow for further debugging


@app.route('/api/players/search', methods=['GET'])
def search_players():
    search_term = request.args.get('name', '').strip() + "%"  # Prepare the search term for matching the beginning
    
    logging.debug(f"Searching for players with name starting with: {search_term}")

    try:
        results = []
        tables = [NFLStats2017, NFLStats2018, NFLStats2019, NFLStats2020, NFLStats2021, NFLStats2022, NFLStats2023]
        
        for table in tables:
            # Use `startswith` to match the beginning of the player's name
            players = table.query.filter(table.player.startswith(search_term)).all()
            logging.debug(f"Found {len(players)} players in {table.__tablename__} starting with {search_term}")
            for player in players:
                results.append({
                    'year': table.__tablename__[-4:],  # Extract the year from the table name
                    'player': player.player,
                    'team': player.tm,
                    'position': player.fantpos,
                    # Include other fields as necessary
                })

        return jsonify(results)
    except Exception as e:
        logging.error(f"Failed to search for players: {e}")
        return jsonify({'error': 'Failed to search for players'}), 500

@app.route('/api/player/stats', methods=['GET'])
def get_player_stats():
    player_name = request.args.get('name', '').strip()
    try:
        results = {}
        # List of your table classes
        tables = [NFLStats2017, NFLStats2018, NFLStats2019, NFLStats2020, NFLStats2021, NFLStats2022, NFLStats2023]
        
        for table in tables:
            # Query for the player stats in each table
            player_stats = table.query.filter_by(player=player_name).first()
            if player_stats:
                # Serialize all fields except sleeper_player_id and remove null values
                stats_dict = {column.name: getattr(player_stats, column.name)
                              for column in player_stats.__table__.columns
                              if column.name != 'sleeper_player_id' and getattr(player_stats, column.name) is not None}
                
                # Add this year's stats to the results dictionary
                results[table.__tablename__[-4:]] = stats_dict
        
        return jsonify(results)
    except Exception as e:
        logging.error(f"Failed to fetch stats for player {player_name}: {e}")
        return jsonify({'error': 'Failed to fetch player stats'}), 500





@app.route('/user/<username>', methods=['GET'])
def get_user_id(username):
    user_id = fetch_user_id(username)
    if user_id:
        return jsonify({'user_id': user_id}), 200
    else:
        return jsonify({'error': 'User not found'}), 404

@lru_cache(maxsize=None)   
def fetch_user_id(username):
    user_url = f'https://api.sleeper.app/v1/user/{username}'
    response = requests.get(user_url)
    if response.status_code == 200:
        user_data = response.json()
        return user_data.get('user_id')
    else:
        app.logger.error(f"Error fetching user ID: {response.status_code}, {response.text}")
        return None

@lru_cache(maxsize=None)
def fetch_user_leagues(user_id, year):
    leagues_url = f'https://api.sleeper.app/v1/user/{user_id}/leagues/nfl/{year}'
    response = requests.get(leagues_url)
    if response.status_code == 200:
        return response.json()
    else:
        app.logger.error(f"Error fetching leagues for user {user_id} for year {year}: {response.status_code}, {response.text}")
        return None
        
@app.route('/user/<user_id>/leagues/<int:year>', methods=['GET'])
def get_user_leagues_endpoint(user_id, year):
    app.logger.info(f"Fetching leagues for user_id: {user_id} and year: {year}")
    leagues = fetch_user_leagues(user_id, year)
    if leagues is not None:
        return jsonify(leagues), 200
    else:
        return jsonify({'error': 'Leagues not found'}), 404

@app.route('/league/<league_id>', methods=['GET'])
def get_league_info_endpoint(league_id):
    league_info = fetch_league_info(league_id)
    if league_info is not None:
        return jsonify(league_info), 200
    else:
        return jsonify({'error': 'League info not found'}), 404
    
@app.route('/league/<league_id>', methods=['GET'])
def fetch_league_info(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}"
    response = requests.get(url)
    if response.status_code == 200:
        print("League data fetched successfully.")
        return response.json()
    else:
        print(f"Error fetching league info: {response.status_code}, {response.text}")
        return None

@app.route('/players/nfl', methods=['GET'])
def get_player_info_endpoint():
    players = fetch_player_info()
    if players:
        return jsonify(players), 200
    else:
        return jsonify({'error': 'Player info not found'}), 404

@app.route('/players/nfl', methods=['GET'])
def fetch_player_info():
    url = 'https://api.sleeper.app/v1/players/nfl'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print('Error fetching player info:', response.status_code)
    return {}

@app.route('/stats/nfl/regular/<int:year>', methods=['GET'])
def get_player_stats_endpoint(year):
    stats = fetch_player_stats(year)
    if stats:
        return jsonify(stats), 200
    else:
        return jsonify({'error': f'Stats for {year} not found'}), 404
    
@app.route('/stats/nfl/regular/<int:year>', methods=['GET'])
def fetch_player_stats(year):
    url = f'https://api.sleeper.app/v1/stats/nfl/regular/{year}'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Error fetching stats for {year}:', response.status_code)
        return {}

@app.route('/user/username/<owner_id>', methods=['GET'])
def get_username_endpoint(owner_id):
    username = fetch_username(owner_id)  
    if username != 'Unknown':
        return jsonify({'username': username}), 200
    else:
        return jsonify({'error': 'Username not found'}), 404
    
@app.route('/user/username/<owner_id>', methods=['GET'])
def fetch_username(owner_id):
    user_url = f'https://api.sleeper.app/v1/user/{owner_id}'
    response = requests.get(user_url)
    if response.status_code == 200:
        user_data = response.json()
        return user_data.get('username', 'Unknown')
    else:
        return 'Unknown'
    
@app.route('/userdata/<int:year>/<user_id>', methods=['GET'])
def get_user_data_endpoint(year, user_id):
    user_data = fetch_user_data(year, user_id)  
    if user_data:
        return jsonify(user_data), 200
    else:
        return jsonify({'error': 'User data not found'}), 404
    
@app.route('/userdata/<int:year>/<user_id>', methods=['GET'])
def fetch_user_data(year, user_id): 
    user_url = f'https://api.sleeper.app/v1/user/{user_id}/leagues/nfl/{year}'
    response = requests.get(user_url)
    return response.json() if response.status_code == 200 else None


@app.route('/leaguedetails/<league_id>', methods=['GET'])
def get_league_details_endpoint(league_id):
    league_details = fetch_league_details(league_id)
    if league_details:
        return jsonify(league_details), 200
    else:
        return jsonify({'error': 'League details not found'}), 404
    
@app.route('/leaguedetails/<league_id>', methods=['GET'])
def fetch_league_details(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else None

@app.route('/league/<league_id>/rosters', methods=['GET'])
def get_league_rosters_endpoint(league_id):
    rosters = fetch_league_rosters(league_id)
    if rosters:
        return jsonify(rosters), 200
    else:
        return jsonify({'error': 'League rosters not found'}), 404
    
@app.route('/league/<league_id>/rosters', methods=['GET'])
def fetch_league_rosters(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}/rosters"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else None
    
def roster_id_to_username(self, roster_id, rosters):
        for roster in rosters:
            if str(roster.get('roster_id')) == str(roster_id):
                owner_id = roster.get('owner_id')
                username = self.fetch_username(owner_id)
                return username
        return "Unknown"

def get_all_usernames(self, rosters):
    usernames = {}
    for roster in rosters:
        owner_id = roster['owner_id']
        username = self.fetch_username(owner_id)
        usernames[owner_id] = username
    return usernames

if __name__ == '__main__':
    app.run(debug=True)
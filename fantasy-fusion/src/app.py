from flask import Flask, jsonify
import requests
from functools import lru_cache
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "Welcome to the Fantasy Fusion API!"

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
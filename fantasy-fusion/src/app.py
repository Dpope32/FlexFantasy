from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import requests
from functools import lru_cache
from flask_cors import CORS
import logging
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename
import logging


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres@localhost:5433/postgres'
app.config['JWT_SECRET_KEY'] = 'LgkxDh-SkRv9o4Jgum2Vrg8tEI_Hv2Yt4NGhBiD5DQc'  
jwt = JWTManager(app)
db = SQLAlchemy(app)
CORS(app, supports_credentials=True, expose_headers=["Authorization"], allow_headers=["Authorization", "Content-Type"])
logging.basicConfig(level=logging.DEBUG)
app.config['UPLOADED_PHOTOS_DEST'] = os.path.join(os.getcwd(), 'uploads')

@app.route('/user-info', methods=['GET'])
@jwt_required()
def user_info():
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            logging.error("JWT identity not found.")
            return jsonify({'error': 'Authentication required, user ID not found.'}), 401

        user = User.query.get(current_user_id)

        if not user:
            logging.error(f"User not found for ID: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404

        user_info = {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'sleeper_username': user.sleeper_username,
            'profile_picture_url': user.profile_picture_url,
        }

        return jsonify(user_info=user_info), 200

    except Exception as e:
        logging.exception("An error occurred while fetching user info.")
        return jsonify({'error': str(e)}), 500

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
class NFLStats2013(NFLStatsBase):
    __tablename__ = 'nfl_stats_2013'
class NFLStats2014(NFLStatsBase):
    __tablename__ = 'nfl_stats_2014'
class NFLStats2015(NFLStatsBase):
    __tablename__ = 'nfl_stats_2015'
class NFLStats2016(NFLStatsBase):
    __tablename__ = 'nfl_stats_2016'
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

class User(db.Model):
    __tablename__ = 'users'  
    user_id = db.Column(db.Integer, primary_key=True)  
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    sleeper_username = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(128)) 
    profile_picture_url = db.Column(db.String(), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
@app.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        new_password = data.get('newPassword')
        if not new_password:
            return jsonify({'error': 'New password is required'}), 400

        user.set_password(new_password)
        db.session.commit()

        return jsonify({'message': 'Password updated successfully'}), 200
    except SQLAlchemyError as e:
        logging.error(f"Error updating password: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update password'}), 500

@app.route('/upload-profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    try:
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({'error': 'Authentication required'}), 401

        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOADED_PHOTOS_DEST'], filename)
            file.save(file_path)
            file_url = os.path.join('/uploads', filename)

            user = User.query.get(current_user_id)
            if user:
                user.profile_picture_url = file_url
                db.session.commit()
                return jsonify({'imageUrl': file_url}), 200
            else:
                return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        logging.error(f"Error uploading profile picture: {e}")
        return jsonify({'error': 'An internal error occurred'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error including the stack trace
    logging.error('Unhandled exception', exc_info=e)
    return jsonify({'error': 'An internal error occurred'}), 500
    
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    logging.debug("Received registration data: %s", data)  # Log the incoming JSON data.

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    sleeper_username = data.get('sleeperUsername')  # Make sure the key matches the frontend.

    if not all([username, email, password]):
        return jsonify({'error': 'Missing data'}), 400

    # Log the sleeper_username to make sure it's what you expect.
    logging.debug("Sleeper username: %s", sleeper_username)

    user = User(username=username, email=email, sleeper_username=sleeper_username)
    user.set_password(password)
    
    db.session.add(user)
    try:
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        logging.error("Error creating user: %s", e)
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()

        if user is None:
            return jsonify({'error': 'User not found'}), 404

        if not user.password_hash:
            app.logger.error(f"User {user.username} has no password set.")
            return jsonify({'error': 'Password not set for user'}), 500

        if user.check_password(data['password']):
            # Generate the JWT access token
            access_token = create_access_token(identity=user.user_id)
            return jsonify({'message': 'Login successful', 'access_token': access_token}), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401

    except Exception as e:
        app.logger.error(f"Login error: {e}")
        return jsonify({'error': 'An internal server error occurred'}), 500

@app.route('/api/stats/2023', methods=['GET'])
def get_2023_stats():
    try:
        stats = NFLStats2023.query.limit(5).all()  
        app.logger.info(f"Fetched {len(stats)} records from NFLStats2023.")
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
    try:
        player_stats = NFLStats2023.query.filter_by(sleeper_player_id=int(sleeper_player_id)).first()
        if player_stats:
            return jsonify({
                'player': player_stats.player,
                'yards': player_stats.yds,
                'touchdowns': player_stats.td,
                'ppg': player_stats.ppr / player_stats.g if player_stats.g else 0
            })
        else:
            return jsonify({'error': 'Player not found with sleeper_player_id={}'.format(sleeper_player_id)}), 404
    except Exception as e:
        logging.error(f"Failed to fetch player stats for ID {sleeper_player_id}: {e}")
        raise  

@app.route('/api/players/search', methods=['GET'])
def search_players():
    search_term = request.args.get('name', '').strip() + "%"  
    try:
        results = []
        tables = [NFLStats2013, NFLStats2014, NFLStats2015, NFLStats2016, NFLStats2017, NFLStats2018, NFLStats2019, NFLStats2020, NFLStats2021, NFLStats2022, NFLStats2023]
        for table in tables:
            players = table.query.filter(table.player.startswith(search_term)).all()
            logging.debug(f"Found {len(players)} players in {table.__tablename__} starting with {search_term}")
            for player in players:
                results.append({
                    'year': table.__tablename__[-4:],  
                    'player': player.player,
                    'team': player.tm,
                    'position': player.fantpos,
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
        tables = [NFLStats2013, NFLStats2014, NFLStats2015, NFLStats2016, NFLStats2017, NFLStats2018, NFLStats2019, NFLStats2020, NFLStats2021, NFLStats2022, NFLStats2023]
        for table in tables:
            player_stats = table.query.filter_by(player=player_name).first()
            if player_stats:
                stats_dict = {column.name: getattr(player_stats, column.name)
                              for column in player_stats.__table__.columns
                              if column.name != 'sleeper_player_id' and getattr(player_stats, column.name) is not None}
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
import tkinter as tk
from tkinter import ttk
import requests
from datetime import datetime
import json
import logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
from functools import lru_cache

def treeview_sort_column(tv, col, reverse):
    l = [(tv.set(k, col), k) for k in tv.get_children('')]
    l.sort(key=lambda t: (t[0].lower(), t[1])) if col == 'Name' else l.sort(key=lambda t: t[0], reverse=reverse)
    for index, (val, k) in enumerate(l):
        tv.move(k, '', index)
    tv.heading(col, command=lambda: treeview_sort_column(tv, col, not reverse))
    
@lru_cache(maxsize=None)   
def fetch_user_id(username):
    user_url = f'https://api.sleeper.app/v1/user/{username}'
    response = requests.get(user_url)
    if response.status_code == 200:
        user_data = response.json()
        if user_data is not None:
            return user_data.get('user_id')  
        else:
            print(f"No data found for username: {username}")
            return None
    else:
        print(f"Error fetching user ID: {response.status_code}, {response.text}")
        return None

@lru_cache(maxsize=None)
def fetch_user_leagues(user_id, year):
    leagues_url = f'https://api.sleeper.app/v1/user/{user_id}/leagues/nfl/{year}'
    print(f"Making GET request to: {leagues_url}")  
    response = requests.get(leagues_url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching leagues for {year}: {response.status_code}, {response.text}")
        return None
    
@lru_cache(maxsize=None)
def fetch_league_info(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}"
    response = requests.get(url)
    if response.status_code == 200:
        league_info = response.json()
        return league_info
    else:
        logging.error(f"Error fetching league info: {response.status_code}, {response.text}")
        return None

@lru_cache(maxsize=None)
def fetch_player_info():
    url = 'https://api.sleeper.app/v1/players/nfl'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print('Error fetching player info:', response.status_code)
    return {}

@lru_cache(maxsize=None)
def fetch_player_stats(year):
    url = f'https://api.sleeper.app/v1/stats/nfl/regular/{year}'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Error fetching stats for {year}:', response.status_code)
        return {}
@lru_cache(maxsize=None)   
def fetch_user_data(username, year, user_id):  
    user_url = f'https://api.sleeper.app/v1/user/{user_id}/leagues/nfl/{year}'
    response = requests.get(user_url)
    return response.json() if response.status_code == 200 else None

@lru_cache(maxsize=None)
def fetch_league_details(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else None

@lru_cache(maxsize=None)
def fetch_league_rosters(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}/rosters"
    response = requests.get(url)
    rosters = response.json() if response.status_code == 200 else []
    return rosters

class MainApplication(tk.Tk):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.title("Sleeper Data")
        self.user_data = None
        self.user_leagues = None  
        self.league_info = None
        self.username = None
        self.container = tk.Frame(self)
        self.container.pack(side="top", fill="both", expand=True)
        self.container.grid_rowconfigure(0, weight=1)
        self.container.grid_columnconfigure(0, weight=1)
        style = ttk.Style()
        style.configure("Treeview", rowheight=25)  
        style.layout("Treeview", [('Treeview.treearea', {'sticky': 'nswe'})])  
        style.layout("Treeview.Item", [('Treeview.row', {'sticky': 'nswe'})])  
        header_style = ttk.Style()
        header_style.configure("Treeview.Heading", font=('Helvetica', 10, 'bold'))
        self.frames = {}
        for F in (StartPage, RankingsPage, UserLeaguesPage):
            frame = F(parent=self.container, controller=self)
            self.frames[F] = frame
            frame.grid(row=0, column=0, sticky="nsew")
        self.show_frame(StartPage)
        self.set_window_size_and_position(percentage=0.65)

    def set_window_size_and_position(self, percentage=0.65):
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        
        window_width = int(screen_width * percentage)
        window_height = int(screen_height * percentage)

        position_right = int((screen_width - window_width) / 2)
        position_down = int((screen_height - window_height) / 2)

        self.geometry(f'{window_width}x{window_height}+{position_right}+{position_down}')

    def show_frame(self, cont, league_id=None, username=None):
        if cont == LeagueDetailsPage and league_id is not None:
            frame = LeagueDetailsPage(parent=self.container, controller=self, league_id=league_id, initial_owner_username=username)
            frame.grid(row=0, column=0, sticky="nsew")
            frame.tkraise()
        else:
            frame = self.frames[cont]
            frame.tkraise()

    def set_user_leagues(self, leagues):
            self.user_leagues = leagues
            self.frames[UserLeaguesPage].update_data() 

    def show_league_details(self, league_info):
            LeagueDetailsPage(self, league_info)

class StartPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller
        self.create_widgets()

    def create_widgets(self):
        title_font = ("Helvetica", 48, "bold italic")
        label = tk.Label(self, text="FlexFantasy", font=title_font, fg="blue")
        label.pack(pady=20)
        username_frame = tk.Frame(self)
        username_frame.pack(pady=20)
        username_label = tk.Label(username_frame, text="Enter Sleeper Username:")
        username_label.pack(side="left", padx=10)
        self.username_entry = tk.Entry(username_frame)
        self.username_entry.pack(side="left")
        submit_button = tk.Button(username_frame, text="Enter", command=self.on_submit, relief="groove")
        submit_button.pack(side="left", padx=10)
        rankings_button = tk.Button(self, text="Model",
            command=lambda: self.controller.show_frame(RankingsPage), relief="groove")
        rankings_button.pack(side="top", pady=10)

    def on_submit(self):
        username = self.username_entry.get()
        user_id = fetch_user_id(username)
        if user_id:
            user_leagues = fetch_user_leagues(user_id, 2023)
            if user_leagues:
                self.controller.username = username  
                self.controller.set_user_leagues(user_leagues)  
                self.controller.show_frame(UserLeaguesPage)
            else:
                print("No leagues found for the user")
        else:
            print("User ID not found")
        self.controller.state('zoomed') 

class UserLeaguesPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller
        self.init_ui()

    def init_ui(self):
        self.label = tk.Label(self, text="Your Leagues", font=("Arial", 16))
        self.label.pack(pady=10)
        self.main_frame = tk.Frame(self)
        self.main_frame.pack(fill="both", expand=True)
        self.tree = ttk.Treeview(self.main_frame, columns=("League Name", "Size", "Bench Spots", "Scoring Settings", "Waiver Budget", "Trade Deadline"), show='headings')
        self.tree.pack(side="left", fill="both", expand=True)
        self.configure_tree_columns()
        self.button_frame = tk.Frame(self.main_frame)
        self.button_frame.pack(side="left", fill="y")
        self.back_button = tk.Button(self, text="Back", command=self.go_back)
        self.back_button.pack(pady=10)
        
    def configure_tree_columns(self):
        self.tree.column("#1", anchor="center", width=120)
        self.tree.column("#2", anchor="center", width=50)
        self.tree.column("#3", anchor="center", width=80)
        self.tree.column("#4", anchor="center", width=120)
        self.tree.column("#5", anchor="center", width=100)
        self.tree.column("#6", anchor="center", width=100)
        self.tree.heading("League Name", text="League Name")
        self.tree.heading("Size", text="Size")
        self.tree.heading("Bench Spots", text="Bench Spots")
        self.tree.heading("Scoring Settings", text="Scoring Settings")
        self.tree.heading("Waiver Budget", text="Waiver Budget")
        self.tree.heading("Trade Deadline", text="Trade Deadline")

    def update_data(self):
        for widget in self.button_frame.winfo_children():
            widget.destroy()

        self.tree.delete(*self.tree.get_children())

        if self.controller.user_leagues:
            for index, league in enumerate(self.controller.user_leagues):
                league_name = league.get("name", "Unknown League")
                if league_name == "Leagues will be posted here!":
                    continue
                league_id = league.get("league_id")
                total_rosters = league.get("total_rosters", "N/A")
                bench_spots = league.get("roster_positions", []).count('BN')
                scoring_description = self.parse_scoring_settings(league.get("scoring_settings", {}))
                waiver_budget = league.get("settings", {}).get("waiver_budget", "N/A")
                trade_deadline = league.get("settings", {}).get("trade_deadline", "N/A")
                if trade_deadline == 99:
                    trade_deadline = "None"
                self.tree.insert('', 'end', values=(league_name, total_rosters, bench_spots, scoring_description, waiver_budget, trade_deadline))
            for widget in self.button_frame.winfo_children():
                widget.destroy()
            for index, league in enumerate(self.controller.user_leagues):
                if league.get("name", "Unknown League") != "Leagues will be posted here!":
                    button = tk.Button(self.button_frame, text="Rosters", width=10, command=lambda lid=league['league_id']: self.open_league_details(lid))
                    button.grid(row=index, column=0, padx=5, pady=5, sticky='ew')
       
    def go_back(self):
        self.controller.show_frame(StartPage)

    def open_league_details(self, league_id):
        self.controller.show_frame(LeagueDetailsPage, league_id, self.controller.username)


    def show_league_details(self, league_id):
        print(f"Showing details for league {league_id}")

    def parse_scoring_settings(self, settings):
        if 'rec' in settings:
            if settings['rec'] == 1.0:
                scoring = 'PPR'
            elif settings['rec'] == 0.5:
                scoring = '0.5 PPR'
            else:
                scoring = 'Non-PPR'
            
            if 'bonus_rec_te' in settings and settings['bonus_rec_te'] > 0:
                scoring += f" + {settings['bonus_rec_te']} TEP"
            return scoring
        return 'Unknown Scoring'
        
    def on_roster_click(self, event):
        region = self.tree.identify("region", event.x, event.y)
        if region == "cell":
            col = self.tree.identify_column(event.x)
            if col == "#10":  
                item_id = self.tree.identify_row(event.y)
                league_id = self.tree.item(item_id, 'values')[7]  
                self.controller.show_frame(LeagueDetailsPage, league_id)

class LeagueDetailsPage(tk.Frame):
    def __init__(self, parent, controller, league_id, initial_owner_username):
        super().__init__(parent)
        self.controller = controller
        self.league_id = league_id
        self.current_owner_username = initial_owner_username.lower()  
        self.league_name = "Loading..."  
        self.roster_positions = []    
        self.init_ui()                  
        self.update_data()   

    def update_tree_height(self, tree, max_height=10):
        """Dynamically adjust the height of a tree view."""
        num_items = len(tree.get_children())
        new_height = min(num_items, max_height)
        tree.config(height=new_height)
        
    def init_ui(self):
        self.top_frame = tk.Frame(self)
        self.top_frame.pack(side="top", fill="x", expand=False)
        self.back_button = tk.Button(self.top_frame, text="Back", command=self.go_back)
        self.back_button.pack(side="left", padx=10, pady=10)
        self.league_details_frame = tk.Frame(self.top_frame)
        self.league_details_frame.pack(side="left", fill="x", expand=True)
        self.change_owner_frame = tk.Frame(self.top_frame)
        self.change_owner_frame.pack(side="right", fill="x", expand=False)
        self.league_name_label = tk.Label(self.league_details_frame, text="League Name: Loading...", font=("Arial", 16, "bold"))
        self.league_name_label.grid(row=0, column=0, sticky="n")
        self.roster_positions_label = tk.Label(self.league_details_frame, text="Roster Positions:", font=("Arial", 12))
        self.roster_positions_label.grid(row=1, column=0, sticky="w")
        self.champ_label = tk.Label(self.league_details_frame, text="2023 Champ: Loading...")
        self.champ_label.grid(row=3, column=0, sticky="w")
        self.change_owner_header = tk.Label(self.change_owner_frame, text="Change owner")
        self.change_owner_header.pack()
        self.owner_var = tk.StringVar()
        self.owner_dropdown = ttk.Combobox(self.change_owner_frame, textvariable=self.owner_var)
        self.owner_dropdown.pack(side="left", padx=2)
        self.enter_button = tk.Button(self.change_owner_frame, text="Enter", command=self.on_owner_change)
        self.enter_button.pack(side="left", padx=2)
        self.separator = ttk.Separator(self, orient='horizontal')
        self.separator.pack(fill='x', expand=False)
        self.starters_header = tk.Label(self, text="Starters", font=("Arial", 16, "bold"))
        self.starters_header.pack(pady=(10, 0))
        self.starters_tree = ttk.Treeview(self, columns=("Owner", "Player", "Position", "Points", "Rank", "Exp"), show='headings')
        self.style_treeview(self.starters_tree)
        self.starters_tree.pack(fill="both", expand=True)
        self.bench_header = tk.Label(self, text="Bench", font=("Arial", 16, "bold"))
        self.bench_header.pack(pady=(5, 0))   
        self.bench_tree = ttk.Treeview(self, columns=("Owner", "Player", "Position", "Points", "Rank", "Exp"), show='')
        self.style_treeview(self.bench_tree)
        self.bench_tree.pack(fill="both", expand=True, pady=0)
        self.ir_header = tk.Label(self, text="IR", font=("Arial", 16, "bold"))
        self.ir_header.pack(pady=(5, 0)) 
        self.ir_tree = ttk.Treeview(self, columns=("Owner", "Player", "Position", "Points", "Rank", "Exp"), show='')
        self.style_treeview(self.ir_tree)
        self.ir_tree.pack(fill="both", expand=True, pady=0)

    def style_treeview(self, tree):
        tree.column("Owner", width=100, stretch=tk.YES)  
        tree.column("Player", width=150, stretch=tk.YES)
        tree.column("Position", width=80, stretch=tk.YES)
        tree.column("Points", width=80, stretch=tk.YES)
        tree.column("Rank", width=100, stretch=tk.YES)
        tree.column("Exp", width=50, stretch=tk.YES)
        tree.heading("Owner", text="Owner")
        tree.heading("Player", text="Player")
        tree.heading("Position", text="Position")
        tree.heading("Points", text="Points")
        tree.heading("Rank", text="Rank")
        tree.heading("Exp", text="Exp")

    def update_data(self):
        league_info = fetch_league_info(self.league_id)

        if league_info:
            self.league_name = league_info.get('name', 'Unknown League')
            self.league_name_label.config(text=f"League Name: {self.league_name}")
            league_rosters = fetch_league_rosters(self.league_id)
            all_players_info = fetch_player_info()
            player_stats_2023 = fetch_player_stats(2023)
            owner_usernames = self.get_all_usernames(league_rosters)
            winner_roster_id = league_info.get('metadata', {}).get('latest_league_winner_roster_id')
            if winner_roster_id:
                winner_username = self.roster_id_to_username(winner_roster_id, league_rosters)
            else:
                winner_username = "Unknown"
                logging.warning("Winner roster ID not found in league metadata")

            self.champ_label.config(text=f"2023 Champ: {winner_username}")

            self.roster_positions = league_info.get('roster_positions', [])
            formatted_roster_positions = self.format_roster_positions(self.roster_positions)
            self.roster_positions_label.config(text=f"Roster Positions: {formatted_roster_positions}")

            all_players_info = fetch_player_info()
            player_stats_2023 = fetch_player_stats(2023)
            if league_rosters:
                owner_usernames = self.get_all_usernames(league_rosters)
                self.populate_dropdown(owner_usernames)
                self.display_league_rosters(league_rosters, all_players_info, owner_usernames, player_stats_2023)
        else:
            logging.error("Failed to retrieve league info")

    def format_roster_positions(self, positions):
        position_count = {}
        formatted_positions = []
        
        for pos in positions:
            if pos == 'BN': 
                continue
            if pos == 'SUPER_FLEX':
                pos = 'SF'
            if pos == 'REC_FLEX': 
                pos = 'FLEX'
            position_count[pos] = position_count.get(pos, 0) + 1

        for pos, count in position_count.items():
            formatted_positions.append(f"{count}{pos}" if count > 1 else pos)
        
        return ', '.join(formatted_positions)

    def populate_dropdown(self, owner_usernames):
        self.owner_dropdown['values'] = list(owner_usernames.values())
        self.owner_dropdown.set(self.current_owner_username)

    def on_owner_change(self):
        self.current_owner_username = self.owner_var.get().lower()
        self.update_data()

    def display_league_rosters(self, rosters, all_players_info, owner_usernames, player_stats):
        self.starters_tree.delete(*self.starters_tree.get_children())
        self.bench_tree.delete(*self.bench_tree.get_children())
        self.ir_tree.delete(*self.ir_tree.get_children())  
        current_roster = next((roster for roster in rosters if owner_usernames[roster['owner_id']].lower() == self.current_owner_username), None)

        if current_roster is None:
            logging.warning(f"No roster found for owner '{self.current_owner_username}'")
            return
        reserve_ids = set(current_roster.get('reserve', []) or [])

        starter_ids = current_roster.get('starters', [])
        starter_positions = self.sort_starters(starter_ids, self.roster_positions, all_players_info)
        for player_id, pos in starter_positions:
            player_info = all_players_info.get(player_id, {})
            player_name = player_info.get('full_name', 'Unknown')
            player_position = pos  
            player_exp = player_info.get('years_exp', 'N/A')
            player_stats_info = player_stats.get(player_id, {})
            player_points = player_stats_info.get('pts_ppr', 'N/A')
            player_rank = player_stats_info.get('rank_ppr', 'N/A')
            self.starters_tree.insert('', 'end', values=(self.current_owner_username, player_name, player_position, player_points, player_rank, player_exp))
        self.update_tree_height(self.starters_tree)
        self.bench_tree.delete(*self.bench_tree.get_children())

        current_roster = next((roster for roster in rosters if owner_usernames[roster['owner_id']].lower() == self.current_owner_username), None)

        if not current_roster:
            logging.warning(f"No roster found for owner '{self.current_owner_username}'")
            return

        reserve_ids = set(current_roster.get('reserve', []) or [])

        all_player_ids = set(current_roster.get('players', []))
        starter_ids = set(current_roster.get('starters', []))
        bench_ids = all_player_ids - starter_ids - reserve_ids

        for player_id in bench_ids:
            player_info = all_players_info.get(player_id, {})
            player_name = player_info.get('full_name', 'Unknown')
            player_position = player_info.get('position', 'Unknown')
            player_exp = player_info.get('years_exp', 'N/A')
            player_stats_info = player_stats.get(player_id, {})
            player_points = player_stats_info.get('pts_ppr', 'N/A')
            player_rank = player_stats_info.get('rank_ppr', 'N/A')
            self.bench_tree.insert('', 'end', values=(self.current_owner_username, player_name, player_position, player_points, player_rank, player_exp))

        self.update_tree_height(self.bench_tree)

        for player_id in reserve_ids:
            player_info = all_players_info.get(player_id, {})
            player_name = player_info.get('full_name', 'Unknown')
            player_position = player_info.get('position', 'Unknown')
            player_exp = player_info.get('years_exp', 'N/A')
            player_stats_info = player_stats.get(player_id, {})
            player_points = player_stats_info.get('pts_ppr', 'N/A')
            player_rank = player_stats_info.get('rank_ppr', 'N/A')
            self.ir_tree.insert('', 'end', values=(self.current_owner_username, player_name, player_position, player_points, player_rank, player_exp))
        self.update_tree_height(self.ir_tree)

    def sort_starters(self, starter_ids, roster_positions, all_players_info):
        position_order = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'RB', 'RB', 'K','DEF']
        sorted_positions = []
        position_counters = {pos: roster_positions.count(pos) for pos in set(roster_positions) if pos != 'BN'}
        if 'SUPER_FLEX' in position_counters:
            position_counters['SF'] = position_counters.pop('SUPER_FLEX')

        for player_id in starter_ids:
            if not player_id.isdigit():
                if 'DEF' in position_counters and position_counters['DEF'] > 0:
                    sorted_positions.append((player_id, 'DEF'))
                    position_counters['DEF'] -= 1
                continue

            player_info = all_players_info.get(player_id, {})
            player_position = player_info.get('position')
            if position_counters.get(player_position, 0) > 0:
                sorted_positions.append((player_id, player_position))
                position_counters[player_position] -= 1
            elif position_counters.get('FLEX', 0) > 0 and player_position in ['RB', 'WR', 'TE']:
                sorted_positions.append((player_id, 'FLEX'))
                position_counters['FLEX'] -= 1
            elif position_counters.get('SF', 0) > 0 and player_position in ['QB', 'RB', 'WR', 'TE']:
                sorted_positions.append((player_id, 'SF'))
                position_counters['SF'] -= 1
        return sorted_positions

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

    @lru_cache(maxsize=None)
    def fetch_username(self, owner_id):
        user_url = f'https://api.sleeper.app/v1/user/{owner_id}'
        response = requests.get(user_url)
        if response.status_code == 200:
            user_data = response.json()
            return user_data.get('username', 'Unknown')
        else:
            return 'Unknown'
        
    def go_back(self):
        self.controller.show_frame(UserLeaguesPage)

class RankingsPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller
        back_button = tk.Button(self, text="Back", command=lambda: controller.show_frame(StartPage), relief="groove")
        back_button.pack(pady=10)
        self.populate_treeview()

    def populate_treeview(self):
        tree_frame = ttk.Frame(self)
        tree_frame.pack(expand=True, fill='both')

        tree = ttk.Treeview(tree_frame, columns=('Year', 'Position', 'Name', 'Rank', 'Points'), show='headings')
        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
        scrollbar.pack(side="right", fill="y")
        tree.configure(yscrollcommand=scrollbar.set)

        columns = [('Year', 80), ('Position', 100), ('Name', 120), ('Rank', 80), ('Points', 80)]
        for col, width in columns:
            tree.column(col, width=width, anchor=tk.CENTER)
            tree.heading(col, text=col, command=lambda _col=col: treeview_sort_column(tree, _col, False))
        all_top_players = self.fetch_data()
        for player in all_top_players:
            tree.insert('', 'end', values=player)

        tree.pack(expand=True, fill='both')

    def fetch_data(self):
        player_info = fetch_player_info()
        all_top_players = []

        for year in range(2016, 2024):
            player_stats = fetch_player_stats(year)
            if player_info and player_stats:
                year_top_players = []
                for player_id, stats in player_stats.items():
                    player_name = player_info.get(player_id, {}).get('full_name', 'Unknown')
                    player_position = player_info.get(player_id, {}).get('position', 'Unknown')
                    rank_ppr = stats.get('rank_ppr', None)
                    fantasy_points = stats.get('pts_ppr', 0)

                    if rank_ppr is not None:
                        year_top_players.append((year, player_position, player_name, rank_ppr, fantasy_points))

                year_top_players = sorted(year_top_players, key=lambda x: x[4], reverse=True)[:10]
                all_top_players.extend(year_top_players)

        return sorted(all_top_players, key=lambda x: x[4], reverse=True)
    
if __name__ == "__main__":
    app = MainApplication()
    app.state('zoomed')  # Maximize the window on Windows (use `attributes('-zoomed', True)` on Linux)
    app.mainloop()


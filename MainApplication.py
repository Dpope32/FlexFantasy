import tkinter as tk
from tkinter import ttk
import requests
from datetime import datetime
import json


def treeview_sort_column(tv, col, reverse):
    l = [(tv.set(k, col), k) for k in tv.get_children('')]
    l.sort(key=lambda t: (t[0].lower(), t[1])) if col == 'Name' else l.sort(key=lambda t: t[0], reverse=reverse)
    for index, (val, k) in enumerate(l):
        tv.move(k, '', index)
    tv.heading(col, command=lambda: treeview_sort_column(tv, col, not reverse))
    
def fetch_user_id(username):
    user_url = f'https://api.sleeper.app/v1/user/{username}'
    response = requests.get(user_url)
    if response.status_code == 200:
        user_data = response.json()
        if user_data is not None:
            return user_data.get('user_id')  # Make sure the key is correct based on the API response structure
        else:
            print(f"No data found for username: {username}")
            return None
    else:
        print(f"Error fetching user ID: {response.status_code}, {response.text}")
        return None


def fetch_user_leagues(user_id, year):
    leagues_url = f'https://api.sleeper.app/v1/user/{user_id}/leagues/nfl/{year}'
    print(f"Making GET request to: {leagues_url}")  # Print the request URL
    response = requests.get(leagues_url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching leagues for {year}: {response.status_code}, {response.text}")
        return None

def fetch_league_info(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}"
    response = requests.get(url)
    if response.status_code == 200:
        print("League data fetched successfully.")
        return response.json()
    else:
        print(f"Error fetching league info: {response.status_code}, {response.text}")
        return None


def fetch_player_info():
    url = 'https://api.sleeper.app/v1/players/nfl'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print('Error fetching player info:', response.status_code)
    return {}

def fetch_player_stats(year):
    url = f'https://api.sleeper.app/v1/stats/nfl/regular/{year}'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Error fetching stats for {year}:', response.status_code)
        return {}
    
def fetch_user_data(username, year, user_id):  # Added user_id as a parameter
    user_url = f'https://api.sleeper.app/v1/user/{user_id}/leagues/nfl/{year}'
    response = requests.get(user_url)
    return response.json() if response.status_code == 200 else None

def fetch_league_details(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else None

def fetch_league_rosters(league_id):
    url = f"https://api.sleeper.app/v1/league/{league_id}/rosters"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else None
    
class MainApplication(tk.Tk):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.title("Sleeper Data")
        self.user_data = None
        self.user_leagues = None  
        self.league_info = None

        self.container = tk.Frame(self)
        self.container.pack(side="top", fill="both", expand=True)
        self.container.grid_rowconfigure(0, weight=1)
        self.container.grid_columnconfigure(0, weight=1)
        style = ttk.Style()
        style.configure("Treeview", rowheight=25)  # Adjust row height if needed
        style.layout("Treeview", [('Treeview.treearea', {'sticky': 'nswe'})])  # Remove borders
        style.layout("Treeview.Item", [('Treeview.row', {'sticky': 'nswe'})])  # Apply style for each item
        header_style = ttk.Style()
        header_style.configure("Treeview.Heading", font=('Helvetica', 10, 'bold'))

        self.frames = {}
        for F in (StartPage, RankingsPage, UserLeaguesPage):
            frame = F(parent=self.container, controller=self)
            self.frames[F] = frame
            frame.grid(row=0, column=0, sticky="nsew")

        self.show_frame(StartPage)

        # Set the window size and position
        self.set_window_size_and_position(percentage=0.65)

    def set_window_size_and_position(self, percentage=0.65):
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        
        window_width = int(screen_width * percentage)
        window_height = int(screen_height * percentage)

        position_right = int((screen_width - window_width) / 2)
        position_down = int((screen_height - window_height) / 2)

        self.geometry(f'{window_width}x{window_height}+{position_right}+{position_down}')

    def show_frame(self, cont, league_id=None):
        if cont == LeagueDetailsPage and league_id is not None:
            frame = LeagueDetailsPage(parent=self.container, controller=self, league_id=league_id)
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
                    self.controller.set_user_leagues(user_leagues)  
                    self.controller.show_frame(UserLeaguesPage)
                else:
                    print("No leagues found for the user")
            else:
                print("User ID not found")

class UserLeaguesPage(tk.Frame):
    def __init__(self, parent, controller):
        super().__init__(parent)
        self.controller = controller
        self.init_ui()

    def init_ui(self):
        self.label = tk.Label(self, text="Your Leagues", font=("Arial", 16))
        self.label.pack(pady=10)

        # Create the main frame
        self.main_frame = tk.Frame(self)
        self.main_frame.pack(fill="both", expand=True)

        # Create the Treeview widget
        self.tree = ttk.Treeview(self.main_frame, columns=("League Name", "Size", "Bench Spots", "Scoring Settings", "Waiver Budget", "Trade Deadline"), show='headings')
        self.tree.pack(side="left", fill="both", expand=True)

        # Configure the column headings
        self.configure_tree_columns()

        # Create a button frame
        self.button_frame = tk.Frame(self.main_frame)
        self.button_frame.pack(side="left", fill="y")

        # Create a back button
        self.back_button = tk.Button(self, text="Back", command=self.go_back)
        self.back_button.pack(pady=10)
        
    def configure_tree_columns(self):
            # Configure the column headings
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
        # Destroy old buttons if updating
        for widget in self.button_frame.winfo_children():
            widget.destroy()

        self.tree.delete(*self.tree.get_children())

        # Populate the tree and button frame with new data
        if self.controller.user_leagues:
            for index, league in enumerate(self.controller.user_leagues):
                league_id = league.get("league_id")
                league_name = league.get("name", "Unknown League")
                total_rosters = league.get("total_rosters", "N/A")
                bench_spots = league.get("roster_positions", []).count('BN')
                scoring_description = self.parse_scoring_settings(league.get("scoring_settings", {}))
                waiver_budget = league.get("settings", {}).get("waiver_budget", "N/A")
                trade_deadline = league.get("settings", {}).get("trade_deadline", "N/A")

                self.tree.insert('', 'end', values=(league_name, total_rosters, bench_spots, scoring_description, waiver_budget, trade_deadline))
            for widget in self.button_frame.winfo_children():
                widget.destroy()

            # Add a Rosters button for each league
            for index, league in enumerate(self.controller.user_leagues):
                button = tk.Button(self.button_frame, text="Rosters", width=10, command=lambda lid=league['league_id']: self.open_league_details(lid))
                button.grid(row=index, column=0, padx=5, pady=5, sticky='ew')
                
    def go_back(self):
        self.controller.show_frame(StartPage)

    def open_league_details(self, league_id):
        # Fetch league details and rosters here if necessary
        self.controller.show_frame(LeagueDetailsPage, league_id)


    def show_league_details(self, league_id):
        # Implement the logic to show league details, such as opening a new window
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
            if col == "#10":  # Assuming 'Rosters' is the 10th column
                item_id = self.tree.identify_row(event.y)
                league_id = self.tree.item(item_id, 'values')[7]  # Get the league ID from the correct column
                self.controller.show_frame(LeagueDetailsPage, league_id)

class LeagueDetailsPage(tk.Frame):
    def __init__(self, parent, controller, league_id):
        super().__init__(parent)
        self.controller = controller
        self.league_id = league_id
        self.init_ui()
        self.update_data()
        
    def init_ui(self):
        self.label = tk.Label(self, text="League Details", font=("Arial", 16))
        self.label.pack(pady=10)

        # Initialize the Treeview for rosters
        self.roster_tree = ttk.Treeview(self, columns=("Owner_ID", "Owner", "Player", "Position"), show='headings')
        self.roster_tree.heading("Owner_ID", text="Owner_ID")
        self.roster_tree.heading("Owner", text="Owner")
        self.roster_tree.heading("Player", text="Player")
        self.roster_tree.heading("Position", text="Position")
        self.roster_tree.pack(fill="both", expand=True)  # Pack the roster_tree into the frame

        # Create a Back button
        self.back_button = tk.Button(self, text="Back", command=self.go_back)
        self.back_button.pack(pady=10)

    def update_data(self):
        # Fetch league rosters and player information
        league_rosters = fetch_league_rosters(self.league_id)
        all_players_info = fetch_player_info()

        # Fetch usernames for each owner in the rosters
        if league_rosters:
            owner_usernames = self.get_all_usernames(league_rosters)
            self.display_league_rosters(league_rosters, all_players_info, owner_usernames)

    def fetch_username(self, owner_id):
        user_url = f'https://api.sleeper.app/v1/user/{owner_id}'
        response = requests.get(user_url)
        if response.status_code == 200:
            user_data = response.json()
            return user_data.get('username', 'Unknown')
        else:
            return 'Unknown'

    def get_all_usernames(self, rosters):
        usernames = {}
        for roster in rosters:
            owner_id = roster['owner_id']
            username = self.fetch_username(owner_id)
            usernames[owner_id] = username
        return usernames

    
    def display_league_rosters(self, rosters, all_players_info, owner_usernames):
        self.roster_tree.delete(*self.roster_tree.get_children())

        for roster in rosters:
            owner_id = roster['owner_id']
            owner_username = owner_usernames.get(owner_id, "Unknown")
            player_ids = roster.get('players', [])
            for player_id in player_ids:
                player_name = all_players_info.get(player_id, {}).get('full_name', 'Unknown')
                player_position = all_players_info.get(player_id, {}).get('position', 'Unknown')
                self.roster_tree.insert('', 'end', values=(owner_id, owner_username, player_name, player_position))

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
    app.mainloop()

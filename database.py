import sqlite3
from sqlite3 import Connection, Cursor

def get_db_connection() -> Connection:
    """
    Establishes a connection to the database.
    """
    conn = sqlite3.connect('your_database.db')  # Update the path to your actual database file
    conn.row_factory = sqlite3.Row  # Allows accessing columns by name
    return conn

def init_db():
    """
    Initializes the database with required tables (e.g., users).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );
    ''')
    
    conn.commit()
    conn.close()

def get_user_by_username(username: str) -> dict:
    """
    Retrieves a user from the database by username.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()
    conn.close()
    
    # Return user as dictionary if found, else return None
    return dict(user) if user else None

def update_user_password(user_id: int, new_password: str):
    """
    Updates the password for a given user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password = ? WHERE id = ?', (new_password, user_id))
    conn.commit()
    conn.close()

def delete_user(user_id: int):
    """
    Deletes a user from the database by user ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
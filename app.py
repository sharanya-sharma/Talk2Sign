from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect, url_for
import os
import uuid
import subprocess
from werkzeug.utils import secure_filename
from utils.config import ASSETS_FOLDER, MERGED_FOLDER
from auth import auth_bp as auth  # Import auth blueprint
from database import init_db      # Import DB initializer

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with a secure secret key in production

# Register auth blueprint
app.register_blueprint(auth)

# Ensure folders exist
os.makedirs(MERGED_FOLDER, exist_ok=True)
os.makedirs(ASSETS_FOLDER, exist_ok=True)

# Initialize the database
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    if not session.get('user_id'):
        return redirect(url_for('auth.login'))
    return render_template('home.html', username=session.get('username'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve video assets from the ASSETS_FOLDER"""
    return send_from_directory(ASSETS_FOLDER, filename)

@app.route('/merged/<path:filename>')
def serve_merged(filename):
    """Serve merged videos from the MERGED_FOLDER"""
    return send_from_directory(MERGED_FOLDER, filename)

@app.route('/merge', methods=['POST'])
def merge_videos():
    """Merge provided videos into one and return the filename."""
    data = request.json
    videos = data.get('videos', [])

    if not videos:
        return jsonify(success=False, error="No videos provided.")

    merged_filename = f"{uuid.uuid4().hex}.mp4"
    output_path = os.path.join(MERGED_FOLDER, merged_filename)
    list_path = os.path.join(MERGED_FOLDER, f"{uuid.uuid4().hex}_list.txt")

    try:
        with open(list_path, 'w') as f:
            for video in videos:
                abs_path = os.path.abspath(os.path.join(ASSETS_FOLDER, video))
                if os.path.exists(abs_path):
                    f.write(f"file '{abs_path}'\n")
                else:
                    return jsonify(success=False, error=f"Video '{video}' not found.")

        result = subprocess.run(
            ['ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_path, '-c', 'copy', output_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        if result.returncode != 0:
            return jsonify(success=False, error="FFmpeg merge failed.")

        return jsonify(success=True, filename=merged_filename)

    except Exception as e:
        return jsonify(success=False, error=str(e))

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
<<<<<<< HEAD
    app.run(host="0.0.0.0", port=port)
=======
    app.run(host="0.0.0.0", port=port)
>>>>>>> 505cd73adab736cfdb1e648985e2c955780f704a

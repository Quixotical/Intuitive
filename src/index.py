from backend import app

if __name__ == "__main__":
    app.secret_key = app.config['SECRET_KEY']
    app.config['SESSION_TYPE'] = 'filesystem'
    app.run(host="0.0.0.0", port=80, threaded=True)

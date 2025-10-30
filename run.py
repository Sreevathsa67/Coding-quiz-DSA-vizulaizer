from server.app import app, create_tables

if __name__ == '__main__':
    with app.app_context():  # ✅ Wrap it!
        create_tables()
        print("Database initialized successfully!")

    print("Starting Flask application...")
    print("Access the application at: http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
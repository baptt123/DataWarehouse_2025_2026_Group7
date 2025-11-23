
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from datetime import date, timedelta

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="datamart-database"
    )
@app.route('/')
def home():
    return "Chào mừng đến với Flask API Weather!"

@app.route('/api/cities', methods=['GET'])
def get_cities():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT city_name FROM fact_weather_report ORDER BY city_name")
    result = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()

    return jsonify({"status": "success", "cities": result})

@app.route('/api/current-weather', methods=['GET'])
def get_current_weather():
    city = request.args.get("city")

    if not city:
        return jsonify({"error": "City is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
                   SELECT city_name, weather_type, actual_date, temp, feels_like, humidity,
                          wind_speed, 1013 AS pressure, 10 AS visibility
                   FROM fact_weather_report
                   WHERE city_name = %s
                   ORDER BY actual_date DESC
                       LIMIT 1
                   """, (city,))

    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return jsonify({"status": "fail", "message": "City not found"}), 404

    row["actual_date"] = row["actual_date"].strftime('%Y-%m-%d')

    return jsonify({"status": "success", "data": row})




@app.route('/api/weather-metrics', methods=['GET'])
def get_weather_metrics():
    city = request.args.get("city")
    if not city:
        return jsonify({"status": "fail", "message": "City is required"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
                SELECT forecast_date, humidity, wind_speed
                FROM fact_weather_report
                WHERE city_name = %s AND forecast_date >= CURDATE()
                ORDER BY forecast_date ASC
                    LIMIT 6
                """
        cursor.execute(query, (city,))
        results = cursor.fetchall()

        for r in results:
            r['forecast_date'] = r['forecast_date'].strftime('%Y-%m-%d')
            r['humidity'] = round(r['humidity'], 2)
            r['wind_speed'] = round(r['wind_speed'], 2)

        return jsonify({"status": "success", "count": len(results), "data": results})

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)

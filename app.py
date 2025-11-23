from flask import Flask, jsonify, request
import mysql.connector
from flask_cors import CORS
from datetime import date

app = Flask(__name__)
CORS(app)

# --- CẤU HÌNH KẾT NỐI DATABASE ---
def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="datamart-database"
    )
    return connection

@app.route('/')
def home():
    return "Chào mừng đến với Flask API Weather!"

# --- API LẤY DANH SÁCH TỈNH/THÀNH PHỐ ---
@app.route('/api/cities', methods=['GET'])
def get_cities():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Lấy danh sách các thành phố duy nhất có trong bảng
        query = "SELECT DISTINCT city_name FROM fact_weather_report ORDER BY city_name ASC"
        cursor.execute(query)
        cities = [row[0] for row in cursor.fetchall()]

        return jsonify({
            "status": "success",
            "cities": cities
        })
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- API LẤY DỮ LIỆU DỰ BÁO THEO THÀNH PHỐ ---
@app.route('/api/weather-forecast', methods=['GET'])
def get_weather_forecast():
    city_name = request.args.get('city') # Lấy tham số city từ URL

    if not city_name:
        return jsonify({"error": "Missing city parameter"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Query lấy 6 ngày từ hôm nay cho thành phố được chọn
        query = """
                SELECT forecast_date, temp, feels_like
                FROM fact_weather_report
                WHERE city_name = %s
                  AND forecast_date >= CURDATE()
                ORDER BY forecast_date ASC
                    LIMIT 6
                """
        cursor.execute(query, (city_name,))
        results = cursor.fetchall()

        # --- XỬ LÝ DỮ LIỆU ---
        labels = []
        temps = []
        feels_likes = []

        for row in results:
            # Format ngày tháng (VD: 21/Nov)
            labels.append(row['forecast_date'].strftime("%d/%b"))
            temps.append(float(row['temp'])) # Chuyển Decimal sang float
            feels_likes.append(float(row['feels_like']))

        # --- TÍNH TRUNG BÌNH ---
        avg_temp = round(sum(temps) / len(temps), 2) if temps else 0
        avg_feel = round(sum(feels_likes) / len(feels_likes), 2) if feels_likes else 0

        return jsonify({
            "status": "success",
            "city": city_name,
            "labels": labels,
            "datasets": {
                "temperature": temps,
                "perceived": feels_likes
            },
            "averages": {
                "temperature": avg_temp,
                "perceived": avg_feel
            }
        })

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)